
import { trafficStore } from '../store/trafficStore';

// Mock routes
const alternateRoutesDB: Record<string, string[]> = {
    'Vyttila-Kakkanad': ['Tripunithura', 'Seaport-Airport Rd'],
    'Edappally-Vyttila': ['Palarivattom Bypass', 'Thammanam'],
};

export function getAlternateRoute(from: string, to: string): string[] | null {
    // Check if main route (direct) is congested
    const startJunction = trafficStore.getJunction(from);

    if (startJunction && startJunction.congestion_level === 'High') {
        const key = `${from}-${to}`;
        return alternateRoutesDB[key] || ['Take any side road', 'Use Google Maps API for real-time detours'];
    }

    return null; // No alternate needed
}
