import { JunctionData } from '../types/trafficTypes';

export function generateSummary(junction: JunctionData): string {
    return `Junction: ${junction.id} | Level: ${junction.congestion_level} | Score: ${junction.congestion_score} | Signal: ${junction.green_duration}s | Emergency: ${junction.emergency_active}`;
}
