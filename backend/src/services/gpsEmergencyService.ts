
import { trafficStore } from '../store/trafficStore';
import { ActiveCorridor, AmbulanceRequest } from '../types/trafficTypes';

// Simple graph for Kochi junctions (Mock)
const adjacencyList: Record<string, string[]> = {
    'Vyttila': ['Palarivattom', 'Edappally'],
    'Palarivattom': ['Vyttila', 'Edappally', 'Kakkanad'],
    'Edappally': ['Vyttila', 'Palarivattom', 'Kakkanad'],
    'Kakkanad': ['Palarivattom', 'Edappally']
};

export class GpsEmergencyService {

    handleEmergencyRequest(request: AmbulanceRequest): ActiveCorridor {
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
                trafficStore.updateJunction(junctionId, {
                    override_mode: true,
                    emergency_active: true,
                    signal_state: 'GREEN',
                    green_duration: 60 // Extended green for corridor
                });
            } catch (e) {
                console.error(`Failed to activate corridor for ${junctionId}`);
            }
        });

        const corridor: ActiveCorridor = {
            ambulance_id,
            path: corridorPath,
            active_since: new Date()
        };

        trafficStore.addCorridor(corridor);
        return corridor;
    }

    private findPath(start: string, end: string): string[] {
        // Simple BFS for finding shortest path in unweighted graph
        const queue: string[][] = [[start]];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const path = queue.shift()!;
            const node = path[path.length - 1];

            if (node === end) return path;

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

export const gpsEmergencyService = new GpsEmergencyService();
