import { CongestionLevel } from '../types/trafficTypes';

export function optimizeSignal(congestionLevel: CongestionLevel): number {
    switch (congestionLevel) {
        case 'High':
            return 60;
        case 'Medium':
            return 45;
        case 'Low':
        default:
            return 30;
    }
}
