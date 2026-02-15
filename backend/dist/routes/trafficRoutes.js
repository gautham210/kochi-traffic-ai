"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trafficStore_1 = require("../store/trafficStore");
const congestionEngine_1 = require("../services/congestionEngine");
const signalOptimizer_1 = require("../services/signalOptimizer");
const emergencyService_1 = require("../services/emergencyService");
const gpsEmergencyService_1 = require("../services/gpsEmergencyService");
const routeOptimizer_1 = require("../services/routeOptimizer");
const environmentalImpact_1 = require("../services/environmentalImpact");
const predictionService_1 = require("../services/predictionService");
const deploymentConfig_1 = require("../config/deploymentConfig");
const router = (0, express_1.Router)();
// POST /api/analyze-traffic
router.post('/analyze-traffic', (req, res) => {
    try {
        const { junction_id, vehicle_count, ambulance_detected } = req.body;
        if (!junction_id || !vehicle_count) {
            return res.status(400).json({ error: 'Missing junction_id or vehicle_count' });
        }
        // 1. Calculate congestion
        const { score, level } = (0, congestionEngine_1.calculateCongestion)(vehicle_count);
        // 2. Optimization
        let duration = (0, signalOptimizer_1.optimizeSignal)(level);
        // 3. Emergency Override (Vision Based)
        const emergency = (0, emergencyService_1.checkEmergency)(ambulance_detected);
        if (emergency.override_mode && emergency.green_duration) {
            duration = emergency.green_duration;
        }
        // 4. Advanced: Prediction & Environment
        const prediction = (0, predictionService_1.predictTraffic)(score);
        // Assume 20% optimization gain for demo calculation
        const totalVehicles = Object.values(vehicle_count).reduce((a, b) => a + b, 0);
        const envMetrics = (0, environmentalImpact_1.calculateEnvironmentalImpact)(totalVehicles, 10);
        // 5. Update Store
        // Note: If GPS Override is active (store), we should respect it too.
        // But Vision Override currently takes precedence in this simple logic unless we check store state first.
        // For now, valid local detection > generic state.
        // Merge existing environmental metrics (cumulative)
        const existingJunction = trafficStore_1.trafficStore.getJunction(junction_id);
        const cumulativeEnv = existingJunction ? {
            co2_saved_g: existingJunction.environmental_metrics.co2_saved_g + envMetrics.co2_saved_g,
            fuel_saved_ml: existingJunction.environmental_metrics.fuel_saved_ml + envMetrics.fuel_saved_ml,
            idle_time_reduced_s: existingJunction.environmental_metrics.idle_time_reduced_s + envMetrics.idle_time_reduced_s
        } : envMetrics;
        const updatedJunction = trafficStore_1.trafficStore.updateJunction(junction_id, {
            vehicle_count,
            congestion_level: level,
            congestion_score: score,
            green_duration: duration,
            signal_state: 'GREEN',
            emergency_active: emergency.emergency_active,
            override_mode: emergency.override_mode,
            predicted_congestion: prediction,
            environmental_metrics: cumulativeEnv
        });
        // 6. Log Event
        let logMessage = `[${junction_id}] Score: ${score} (${level}) → Green: ${duration}s`;
        if (emergency.emergency_active) {
            logMessage += ` 🚑 EMERGENCY OVERRIDE`;
        }
        trafficStore_1.trafficStore.addLog(logMessage);
        return res.json(updatedJunction);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// POST /api/emergency-gps
router.post('/emergency-gps', (req, res) => {
    try {
        const body = req.body;
        const corridor = gpsEmergencyService_1.gpsEmergencyService.handleEmergencyRequest(body);
        res.json({ success: true, corridor });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/heatmap
router.get('/heatmap', (req, res) => {
    const data = trafficStore_1.trafficStore.getAllJunctions().map(j => ({
        junction: j.id,
        lat: j.location.lat,
        lng: j.location.lng,
        congestion_level: j.congestion_level,
        score: j.congestion_score
    }));
    res.json(data);
});
// GET /api/alternate-route
router.get('/alternate-route', (req, res) => {
    const { from, to } = req.query;
    if (typeof from !== 'string' || typeof to !== 'string') {
        res.status(400).json({ error: 'Missing from/to params' });
        return;
    }
    const route = (0, routeOptimizer_1.getAlternateRoute)(from, to);
    res.json({ from, to, alternate_routes: route });
});
// GET /api/environmental-impact
router.get('/environmental-impact', (req, res) => {
    res.json(trafficStore_1.trafficStore.getEnvironmentalImpact());
});
// GET /api/deployment-info
router.get('/deployment-info', (req, res) => {
    res.json(deploymentConfig_1.deploymentConfig);
});
// GET /api/system-architecture
router.get('/system-architecture', (req, res) => {
    res.json(deploymentConfig_1.systemArchitecture);
});
// GET /api/implementation-plan
router.get('/implementation-plan', (req, res) => {
    res.json(deploymentConfig_1.deploymentConfig.pilot_plan);
});
// Standard GETs
router.get('/traffic-status', (req, res) => {
    res.json(trafficStore_1.trafficStore.getAllJunctions());
});
router.get('/congestion-history', (req, res) => {
    const history = trafficStore_1.trafficStore.getAllJunctions().reduce((acc, junction) => {
        acc[junction.id] = junction.history;
        return acc;
    }, {});
    res.json(history);
});
router.get('/event-log', (req, res) => {
    res.json(trafficStore_1.trafficStore.getLogs());
});
exports.default = router;
