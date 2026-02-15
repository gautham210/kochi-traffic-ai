
import { Router, Request, Response } from 'express';
import { trafficStore } from '../store/trafficStore';
import { calculateCongestion } from '../services/congestionEngine';
import { optimizeSignal } from '../services/signalOptimizer';
import { checkEmergency } from '../services/emergencyService';
import { gpsEmergencyService } from '../services/gpsEmergencyService';
import { getAlternateRoute } from '../services/routeOptimizer';
import { calculateEnvironmentalImpact } from '../services/environmentalImpact';
import { predictTraffic } from '../services/predictionService';
import { simulationService } from '../services/simulationService';
import { incidentService } from '../services/incidentService';
import { weatherService } from '../services/weatherService';
import { aiService } from '../services/aiService';
import { TrafficUpdatePayload, AmbulanceRequest } from '../types/trafficTypes';
import { deploymentConfig, systemArchitecture } from '../config/deploymentConfig';

const router = Router();

// POST /api/analyze-traffic
router.post('/analyze-traffic', (req: Request, res: Response): any => {
    try {
        const { junction_id, vehicle_count, ambulance_detected }: TrafficUpdatePayload = req.body;

        if (!junction_id || !vehicle_count) {
            return res.status(400).json({ error: 'Missing junction_id or vehicle_count' });
        }

        const { score, level } = calculateCongestion(vehicle_count);
        let duration = optimizeSignal(level);

        const emergency = checkEmergency(ambulance_detected);
        if (emergency.override_mode && emergency.green_duration) {
            duration = emergency.green_duration;
        }

        const prediction = predictTraffic(score);
        const totalVehicles = Object.values(vehicle_count).reduce((a, b) => a + b, 0);
        const envMetrics = calculateEnvironmentalImpact(totalVehicles, 10);

        // Add Trees Equivalent Logic (Mock: 10kg CO2 = 1 Tree/year approx. Very rough)
        // 1g CO2 = 0.0001 Tree
        if (envMetrics.co2_saved_g) {
            envMetrics.trees_equivalent = envMetrics.co2_saved_g * 0.0001;
        }

        const existingJunction = trafficStore.getJunction(junction_id);
        const cumulativeEnv = existingJunction ? {
            co2_saved_g: existingJunction.environmental_metrics.co2_saved_g + envMetrics.co2_saved_g,
            fuel_saved_ml: existingJunction.environmental_metrics.fuel_saved_ml + envMetrics.fuel_saved_ml,
            idle_time_reduced_s: existingJunction.environmental_metrics.idle_time_reduced_s + envMetrics.idle_time_reduced_s,
            trees_equivalent: (existingJunction.environmental_metrics.trees_equivalent || 0) + (envMetrics.trees_equivalent || 0)
        } : envMetrics;

        const weather = weatherService.getWeatherForJunction(junction_id);

        const updatedJunction = trafficStore.updateJunction(junction_id, {
            vehicle_count,
            congestion_level: level,
            congestion_score: score,
            green_duration: duration,
            signal_state: 'GREEN',
            emergency_active: emergency.emergency_active,
            override_mode: emergency.override_mode,
            predicted_congestion: prediction,
            environmental_metrics: cumulativeEnv,
            weather: weather
        } as any);

        let logMessage = `[${junction_id}] Score: ${score} (${level}) → Green: ${duration}s`;
        if (emergency.emergency_active) {
            logMessage += ` 🚨 EMERGENCY PRIORITY ACTIVE`;
        }
        trafficStore.addLog(logMessage);

        return res.json(updatedJunction);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// GPS Emergency
router.post('/emergency-gps', (req: Request, res: Response) => {
    try {
        const body: AmbulanceRequest = req.body;
        const corridor = gpsEmergencyService.handleEmergencyRequest(body);
        res.json({ success: true, corridor });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Incident Management
router.post('/incident/trigger', (req: Request, res: Response) => {
    const { junction_id, type } = req.body;
    const incident = incidentService.triggerIncident(junction_id, type);
    res.json(incident);
});

router.post('/incident/clear', (req: Request, res: Response) => {
    const { junction_id } = req.body;
    incidentService.clearIncident(junction_id);
    res.json({ success: true });
});

// Simulation
router.post('/simulation/time-scale', (req: Request, res: Response) => {
    const { scale } = req.body;
    simulationService.setTimeScale(scale);
    res.json({ scale, message: "Time scale updated" });
});

router.post('/emergency-demo', (req: Request, res: Response) => {
    const { junction_id } = req.body;
    trafficStore.updateJunction(junction_id, {
        override_mode: true,
        emergency_active: true,
        signal_state: 'GREEN',
        green_duration: 60
    });
    trafficStore.addLog(`🚨 MANUAL EMERGENCY TRIGGERED for ${junction_id}`);
    res.json({ success: true });
});

router.post('/emergency-clear', (req: Request, res: Response) => {
    const { junction_id } = req.body;
    trafficStore.updateJunction(junction_id, {
        override_mode: false,
        emergency_active: false
    });
    trafficStore.addLog(`🟢 EMERGENCY CLEARED for ${junction_id}`);
    res.json({ success: true });
});


// GETs
router.get('/heatmap', (req: Request, res: Response) => {
    const data = trafficStore.getAllJunctions().map(j => ({
        junction: j.id,
        lat: j.location.lat,
        lng: j.location.lng,
        congestion_level: j.congestion_level,
        score: j.congestion_score
    }));
    res.json(data);
});

router.get('/weather', (req: Request, res: Response) => {
    // Return sample weather for all junctions
    // In real app, query by junction id
    res.json(weatherService.getWeatherForJunction("Vyttila"));
});

router.get('/traffic-pattern', (req: Request, res: Response) => {
    res.json(simulationService.getTrafficPattern());
});

router.get('/ai/insight', (req: Request, res: Response) => {
    // Get insight for a random or specific junction
    // For demo, list insights for all
    const junctions = trafficStore.getAllJunctions();
    const insights = junctions.map(j => ({
        junction: j.id,
        text: aiService.generateInsight(j)
    }));
    res.json(insights);
});

router.get('/alerts', (req: Request, res: Response) => {
    res.json(trafficStore.getAlerts());
});

// Standard
router.get('/traffic-status', (req: Request, res: Response) => {
    res.json(trafficStore.getAllJunctions());
});

router.get('/environmental-impact', (req: Request, res: Response) => {
    res.json(trafficStore.getEnvironmentalImpact());
});

router.get('/alternate-route', (req: Request, res: Response): any => {
    const { from, to } = req.query;
    if (typeof from !== 'string' || typeof to !== 'string') {
        return res.status(400).json({ error: 'Missing from/to params' });
    }
    const route = getAlternateRoute(from, to);
    res.json({ from, to, alternate_routes: route });
});

router.get('/deployment-info', (req: Request, res: Response) => { res.json(deploymentConfig); });
router.get('/system-architecture', (req: Request, res: Response) => { res.json(systemArchitecture); });
router.get('/implementation-plan', (req: Request, res: Response) => { res.json(deploymentConfig.pilot_plan); });
router.get('/congestion-history', (req: Request, res: Response) => {
    const history = trafficStore.getAllJunctions().reduce((acc, junction) => {
        acc[junction.id] = junction.history;
        return acc;
    }, {} as Record<string, any>);
    res.json(history);
});
router.get('/event-log', (req: Request, res: Response) => { res.json(trafficStore.getLogs()); });

export default router;
