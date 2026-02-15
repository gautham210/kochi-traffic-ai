
import { JunctionData, VehicleCount, CongestionLevel, HistoryEntry, ActiveCorridor, EnvironmentalMetrics, Alert } from '../types/trafficTypes';

const initialJunctions: string[] = ['Vyttila', 'Edappally', 'Palarivattom', 'Kakkanad'];

// Mock locations for Kochi junctions
const junctionLocations: Record<string, { lat: number; lng: number }> = {
    'Vyttila': { lat: 9.9658, lng: 76.3182 },
    'Edappally': { lat: 10.0261, lng: 76.3085 },
    'Palarivattom': { lat: 10.0055, lng: 76.3065 },
    'Kakkanad': { lat: 10.0159, lng: 76.3419 }
};

export class TrafficStore {
    private data: Map<string, JunctionData> = new Map();
    private logs: string[] = [];
    private activeCorridors: ActiveCorridor[] = [];
    private alerts: Alert[] = []; // Authority Alerts
    private lastRealUpdates: Map<string, number> = new Map();

    constructor() {
        initialJunctions.forEach(id => {
            this.data.set(id, {
                id,
                vehicle_count: { cars: 0, bikes: 0, buses: 0, trucks: 0, autos: 0 },
                congestion_level: 'Low',
                congestion_score: 10, // Non-zero start
                signal_state: 'RED',
                green_duration: 30,
                emergency_active: false,
                override_mode: false,
                last_updated: new Date(),
                history: [],
                location: junctionLocations[id] || { lat: 0, lng: 0 },
                environmental_metrics: { co2_saved_g: 0, fuel_saved_ml: 0, idle_time_reduced_s: 0, trees_equivalent: 0 },
                predicted_congestion: { next_cycle_congestion_level: 'Low', confidence: 0 }
            });
        });
    }

    getJunction(id: string): JunctionData | undefined {
        return this.data.get(id);
    }

    getAllJunctions(): JunctionData[] {
        return Array.from(this.data.values());
    }

    // Called by Vision API (High Priority)
    updateJunction(id: string, updates: Partial<JunctionData>): JunctionData {
        this.lastRealUpdates.set(id, Date.now());
        return this.internalUpdate(id, updates);
    }

    // Called by Simulation Loop (Low Priority)
    updateSimulation(id: string, updates: Partial<JunctionData>) {
        const lastReal = this.lastRealUpdates.get(id) || 0;
        // If real data received in last 10 seconds, ignore simulation (except metrics)
        if (Date.now() - lastReal < 10000) {
            // We might still want to update metrics or history if needed, 
            // but for now we skip traffic state overwrite.
            return;
        }
        this.internalUpdate(id, updates);
    }

    // Force update for Emergency Corridors (Absolute Priority)
    forceUpdate(id: string, updates: Partial<JunctionData>) {
        this.internalUpdate(id, updates);
    }

    private internalUpdate(id: string, updates: Partial<JunctionData>): JunctionData {
        const current = this.data.get(id);
        if (!current) throw new Error(`Junction ${id} not found`);

        let newHistory = current.history;
        if (updates.vehicle_count || updates.congestion_level) {
            const entry: HistoryEntry = {
                timestamp: new Date(),
                vehicle_count: updates.vehicle_count || current.vehicle_count,
                congestion_level: updates.congestion_level || current.congestion_level
            };
            newHistory = [entry, ...current.history].slice(0, 50);
        }

        const updated: JunctionData = {
            ...current,
            ...updates,
            history: newHistory,
            last_updated: new Date()
        };

        this.data.set(id, updated);
        return updated;
    }

    addLog(message: string) {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.unshift(`[${timestamp}] ${message}`);
        if (this.logs.length > 100) this.logs.pop();
    }

    getLogs(): string[] {
        return this.logs;
    }

    addCorridor(corridor: ActiveCorridor) {
        this.activeCorridors.push(corridor);
        this.addLog(`🚨 Emergency Corridor ACTIVATED for ${corridor.ambulance_id}. Path: ${corridor.path.join(' -> ')}`);
    }

    getActiveCorridors() {
        return this.activeCorridors;
    }

    getEnvironmentalImpact() {
        let totalCO2 = 0;
        let totalFuel = 0;
        let totalTime = 0;
        let totalTrees = 0;

        this.data.forEach(j => {
            totalCO2 += j.environmental_metrics.co2_saved_g;
            totalFuel += j.environmental_metrics.fuel_saved_ml;
            totalTime += j.environmental_metrics.idle_time_reduced_s;
            totalTrees += (j.environmental_metrics.trees_equivalent || 0);
        });

        return { totalCO2, totalFuel, totalTime, totalTrees };
    }

    // --- Alert System ---
    addAlert(alert: Alert) {
        this.alerts.unshift(alert);
        if (this.alerts.length > 50) this.alerts.pop();
    }

    getAlerts() {
        return this.alerts;
    }
}

export const trafficStore = new TrafficStore();
