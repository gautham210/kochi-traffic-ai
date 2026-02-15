"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trafficStore = exports.TrafficStore = void 0;
const initialJunctions = ['Vyttila', 'Edappally', 'Palarivattom', 'Kakkanad'];
// Mock locations for Kochi junctions
const junctionLocations = {
    'Vyttila': { lat: 9.9658, lng: 76.3182 },
    'Edappally': { lat: 10.0261, lng: 76.3085 },
    'Palarivattom': { lat: 10.0055, lng: 76.3065 },
    'Kakkanad': { lat: 10.0159, lng: 76.3419 }
};
class TrafficStore {
    constructor() {
        this.data = new Map();
        this.logs = [];
        this.activeCorridors = [];
        initialJunctions.forEach(id => {
            this.data.set(id, {
                id,
                vehicle_count: { cars: 0, bikes: 0, buses: 0, trucks: 0, autos: 0 },
                congestion_level: 'Low',
                congestion_score: 0,
                signal_state: 'RED', // Default start
                green_duration: 30, // Default Low
                emergency_active: false,
                override_mode: false,
                last_updated: new Date(),
                history: [],
                location: junctionLocations[id] || { lat: 0, lng: 0 },
                environmental_metrics: { co2_saved_g: 0, fuel_saved_ml: 0, idle_time_reduced_s: 0 },
                predicted_congestion: { next_cycle_congestion_level: 'Low', confidence: 0 }
            });
        });
    }
    getJunction(id) {
        return this.data.get(id);
    }
    getAllJunctions() {
        return Array.from(this.data.values());
    }
    updateJunction(id, updates) {
        const current = this.data.get(id);
        if (!current)
            throw new Error(`Junction ${id} not found`);
        // Manage history
        let newHistory = current.history;
        // Add history if counts or congestion details changed
        if (updates.vehicle_count || updates.congestion_level) {
            const entry = {
                timestamp: new Date(),
                vehicle_count: updates.vehicle_count || current.vehicle_count,
                congestion_level: updates.congestion_level || current.congestion_level
            };
            // Keep last 50 entries
            newHistory = [entry, ...current.history].slice(0, 50);
        }
        const updated = Object.assign(Object.assign(Object.assign({}, current), updates), { history: newHistory, last_updated: new Date() });
        this.data.set(id, updated);
        return updated;
    }
    addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.unshift(`[${timestamp}] ${message}`);
        // Keep last 100 logs
        if (this.logs.length > 100)
            this.logs.pop();
    }
    getLogs() {
        return this.logs;
    }
    // --- New Methods ---
    addCorridor(corridor) {
        this.activeCorridors.push(corridor);
        this.addLog(`🚑 Green Corridor ACTIVATED for ${corridor.ambulance_id}. Path: ${corridor.path.join(' -> ')}`);
    }
    getActiveCorridors() {
        return this.activeCorridors;
    }
    getEnvironmentalImpact() {
        let totalCO2 = 0;
        let totalFuel = 0;
        this.data.forEach(j => {
            totalCO2 += j.environmental_metrics.co2_saved_g;
            totalFuel += j.environmental_metrics.fuel_saved_ml;
        });
        return { totalCO2, totalFuel };
    }
}
exports.TrafficStore = TrafficStore;
exports.trafficStore = new TrafficStore();
