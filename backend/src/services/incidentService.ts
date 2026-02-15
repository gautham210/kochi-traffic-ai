
import { IncidentType, Incident } from '../types/trafficTypes';
import { trafficStore } from '../store/trafficStore';

export class IncidentService {

    triggerIncident(junctionId: string, type: IncidentType): Incident {
        const incident: Incident = {
            id: `INC-${Date.now()}`,
            junction_id: junctionId,
            type,
            active: true,
            timestamp: new Date(),
            description: this.getDescription(type)
        };

        // Update Store
        trafficStore.updateJunction(junctionId, {
            current_incident: incident,
            congestion_level: 'High', // Incidents cause traffic
            override_mode: true // Manual control might be needed
        });

        // Log Alerts
        trafficStore.addAlert({
            id: `ALT-${Date.now()}`,
            timestamp: new Date(),
            source: 'AI_SYSTEM',
            message: `Incident Detected at ${junctionId}: ${type}. Adapting Signal Timing.`,
            severity: 'CRITICAL'
        });

        trafficStore.addAlert({
            id: `ALT-${Date.now() + 1}`,
            timestamp: new Date(),
            source: 'POLICE',
            message: `Dispatching Unit to ${junctionId}.`,
            severity: 'INFO'
        });

        return incident;
    }

    clearIncident(junctionId: string) {
        trafficStore.updateJunction(junctionId, {
            current_incident: undefined,
            override_mode: false
        });

        trafficStore.addAlert({
            id: `ALT-${Date.now()}`,
            timestamp: new Date(),
            source: 'AI_SYSTEM',
            message: `Incident Cleared at ${junctionId}. Returning to Adaptive Mode.`,
            severity: 'INFO'
        });
    }

    private getDescription(type: IncidentType): string {
        switch (type) {
            case 'ACCIDENT': return "Vehicle collision reported. Lanes blocked.";
            case 'ROAD_BLOCK': return "Construction work or blockage.";
            case 'WATERLOGGING': return "High water levels detected. Traffic slow.";
            case 'TREE_FALL': return "Obstruction on road.";
            default: return "Unknown incident";
        }
    }
}

export const incidentService = new IncidentService();
