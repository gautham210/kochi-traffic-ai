
import { JunctionData } from '../types/trafficTypes';

export class AiService {

    generateInsight(junction: JunctionData): string {
        const time = new Date().getHours();
        let timeDesc = "mid-day";
        if (time >= 8 && time <= 11) timeDesc = "morning peak";
        if (time >= 17 && time <= 20) timeDesc = "evening rush";

        let insight = `Analyzing ${junction.id}: `;

        if (junction.current_incident) {
            insight += `CRITICAL: ${junction.current_incident.type} detected. Congestion likely to surge. Rerouting disabled lanes.`;
        } else if (junction.emergency_active) {
            insight += `Emergency Priority Active. Green Wave enabled. Expected delay for cross-traffic: 45s.`;
        } else if (junction.congestion_level === 'High') {
            insight += `Heavy traffic due to ${timeDesc}. Signal optimization maxed out. Suggesting alternate routes to Kakkanad.`;
        } else if (junction.weather && junction.weather.condition === 'Rainy') {
            insight += `Rain detected. Slower vehicle speeds engaged. Signal buffer increased by 10%.`;
        } else {
            insight += `Traffic flow nominal. AI optimization saving 15% idle time vs fixed signal.`;
        }

        return insight;
    }
}

export const aiService = new AiService();
