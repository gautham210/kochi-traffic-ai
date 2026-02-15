
import { trafficStore } from '../store/trafficStore';
import { CongestionLevel, JunctionData } from '../types/trafficTypes';

export class SimulationService {
    private timeScale: number = 1;
    private simTime: Date = new Date();
    private intervalId: NodeJS.Timeout;
    private topology: string[] = ['Vyttila', 'Edappally', 'Palarivattom', 'Kakkanad']; // Simple ring/line

    constructor() {
        // Start the simulation loop
        this.intervalId = setInterval(() => this.tick(), 1000); // 1 Real Second Tick
        console.log("Simulation Engine Started.");
    }

    setTimeScale(scale: number) {
        this.timeScale = scale;
    }

    getTimeScale() {
        return this.timeScale;
    }

    private tick() {
        // Advance Time
        this.simTime = new Date(this.simTime.getTime() + (1000 * this.timeScale));
        const hour = this.simTime.getHours();

        // 1. Calculate Base Traffic Score based on Hour
        let baseScore = 20;
        if (hour >= 0 && hour < 6) baseScore = 15; // Low Night
        else if (hour >= 6 && hour < 10) baseScore = 65; // Morning Rise
        else if (hour >= 10 && hour < 17) baseScore = 50; // Midday
        else if (hour >= 17 && hour < 21) baseScore = 85; // Evening Peak
        else if (hour >= 21) baseScore = 40; // Moderate Night

        // Apply to all junctions
        const junctions = trafficStore.getAllJunctions();

        junctions.forEach((j, index) => {
            // 2. Random Fluctuations (+/- 10)
            const variance = Math.floor(Math.random() * 20) - 10;
            let score = Math.max(5, Math.min(100, baseScore + variance));

            // Different offsets for different junctions to avoid sync
            if (index % 2 === 0) score += 5;
            else score -= 5;

            // 3. Determine Level
            let level: CongestionLevel = 'Low';
            if (score > 40) level = 'Medium';
            if (score > 75) level = 'High';

            // 4. Update Environmental Metrics (Simulated accumulation)
            // 0.1g CO2 per tick * scale
            const newMetrics = {
                co2_saved_g: j.environmental_metrics.co2_saved_g + (0.5 * this.timeScale),
                fuel_saved_ml: j.environmental_metrics.fuel_saved_ml + (0.2 * this.timeScale),
                idle_time_reduced_s: j.environmental_metrics.idle_time_reduced_s + (1 * this.timeScale),
                trees_equivalent: (j.environmental_metrics.trees_equivalent || 0) + (0.00005 * this.timeScale)
            };

            // 5. Update Store (Safe Update - respects Vision override)
            trafficStore.updateSimulation(j.id, {
                congestion_score: score,
                congestion_level: level,
                signal_state: score > 70 ? 'RED' : 'GREEN', // Simple logic
                environmental_metrics: newMetrics
            });

            // 6. Emergency Corridor Check
            if (j.emergency_active) {
                this.handleEmergencyNetwork(j.id);
            }
        });
    }

    private handleEmergencyNetwork(sourceId: string) {
        // Force GREEN for Source + Next 2 Junctions
        const idx = this.topology.indexOf(sourceId);
        if (idx === -1) return;

        const targets = [
            sourceId,
            this.topology[(idx + 1) % this.topology.length],
            this.topology[(idx + 2) % this.topology.length]
        ];

        targets.forEach(tid => {
            trafficStore.forceUpdate(tid, {
                signal_state: 'GREEN',
                green_duration: 60,
                override_mode: true,
                congestion_level: 'Low' // Clear path
            });
        });
    }

    getTrafficPattern() {
        const pattern = [];
        for (let i = 0; i < 24; i++) {
            let load = 20;
            if (i >= 8 && i <= 11) load = 80 + Math.random() * 20;
            else if (i >= 17 && i <= 20) load = 90 + Math.random() * 10;
            else if (i > 0 && i < 5) load = 5 + Math.random() * 5;
            else load = 40 + Math.random() * 20;
            pattern.push({ hour: i, load: Math.floor(load) });
        }
        return pattern;
    }
}

export const simulationService = new SimulationService();
