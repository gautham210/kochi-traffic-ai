"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeSignal = optimizeSignal;
function optimizeSignal(congestionLevel) {
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
