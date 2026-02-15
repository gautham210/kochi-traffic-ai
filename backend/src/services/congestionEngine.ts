import { VehicleCount, CongestionLevel } from '../types/trafficTypes';

const WEIGHTS = {
    car: 2,
    bike: 1,
    bus: 5,
    truck: 6,
    auto: 2
};

export function calculateCongestion(counts: VehicleCount): { score: number; level: CongestionLevel } {
    const score = (counts.cars * WEIGHTS.car) +
        (counts.bikes * WEIGHTS.bike) +
        (counts.buses * WEIGHTS.bus) +
        (counts.trucks * WEIGHTS.truck) +
        (counts.autos * WEIGHTS.auto);

    let level: CongestionLevel = 'Low';

    // Logic: 
    // Low: score < 50
    // Medium: 50 <= score <= 100
    // High: score > 100
    if (score > 100) {
        level = 'High';
    } else if (score >= 50) {
        level = 'Medium';
    }

    return { score, level };
}
