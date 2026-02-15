"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlternateRoute = getAlternateRoute;
const trafficStore_1 = require("../store/trafficStore");
// Mock routes
const alternateRoutesDB = {
    'Vyttila-Kakkanad': ['Tripunithura', 'Seaport-Airport Rd'],
    'Edappally-Vyttila': ['Palarivattom Bypass', 'Thammanam'],
};
function getAlternateRoute(from, to) {
    // Check if main route (direct) is congested
    const startJunction = trafficStore_1.trafficStore.getJunction(from);
    if (startJunction && startJunction.congestion_level === 'High') {
        const key = `${from}-${to}`;
        return alternateRoutesDB[key] || ['Take any side road', 'Use Google Maps API for real-time detours'];
    }
    return null; // No alternate needed
}
