"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictTraffic = predictTraffic;
function predictTraffic(currentScore) {
    // Simple trend prediction
    // If score > 80, likely High next cycle
    // Confidence is mock
    let nextLevel = 'Low';
    let confidence = 0.85;
    if (currentScore > 90) {
        nextLevel = 'High';
        confidence = 0.92;
    }
    else if (currentScore > 40) {
        nextLevel = 'Medium';
        confidence = 0.75;
    }
    return {
        next_cycle_congestion_level: nextLevel,
        confidence
    };
}
