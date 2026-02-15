"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpsEmergencyService = exports.GpsEmergencyService = void 0;
const trafficStore_1 = require("../store/trafficStore");
// Simple graph for Kochi junctions (Mock)
const adjacencyList = {
    'Vyttila': ['Palarivattom', 'Edappally'],
    'Palarivattom': ['Vyttila', 'Edappally', 'Kakkanad'],
    'Edappally': ['Vyttila', 'Palarivattom', 'Kakkanad'],
    'Kakkanad': ['Palarivattom', 'Edappally']
};
class GpsEmergencyService {
    handleEmergencyRequest(request) {
        const { ambulance_id, destination } = request;
        // 1. Find nearest junction to current location (Mock logic: randomly pick start or assume Vyttila for demo if not close)
        // For this hackathon, we will assume a valid path is found from "Vyttila" to "Kakkanad" or similar.
        // In a real app, we'd use GeoLib to find closest junction node.
        let startNode = 'Vyttila';
        let endNode = 'Kakkanad';
        // 2. Compute Path (BFS)
        const path = this.findPath(startNode, endNode);
        // 3. Activate Green Corridor
        // Activate for current + next 3
        const corridorPath = path.slice(0, 4);
        corridorPath.forEach(junctionId => {
            try {
                trafficStore_1.trafficStore.updateJunction(junctionId, {
                    override_mode: true,
                    emergency_active: true,
                    signal_state: 'GREEN',
                    green_duration: 60 // Extended green for corridor
                });
            }
            catch (e) {
                console.error(`Failed to activate corridor for ${junctionId}`);
            }
        });
        const corridor = {
            ambulance_id,
            path: corridorPath,
            active_since: new Date()
        };
        trafficStore_1.trafficStore.addCorridor(corridor);
        return corridor;
    }
    findPath(start, end) {
        // Simple BFS for finding shortest path in unweighted graph
        const queue = [[start]];
        const visited = new Set();
        while (queue.length > 0) {
            const path = queue.shift();
            const node = path[path.length - 1];
            if (node === end)
                return path;
            if (!visited.has(node)) {
                visited.add(node);
                const neighbors = adjacencyList[node] || [];
                for (const neighbor of neighbors) {
                    const newPath = [...path, neighbor];
                    queue.push(newPath);
                }
            }
        }
        return [start]; // Fallback
    }
}
exports.GpsEmergencyService = GpsEmergencyService;
exports.gpsEmergencyService = new GpsEmergencyService();
