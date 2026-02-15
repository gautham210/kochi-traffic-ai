"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmergency = checkEmergency;
function checkEmergency(ambulanceDetected) {
    if (ambulanceDetected) {
        return {
            emergency_active: true,
            override_mode: true,
            green_duration: 45
        };
    }
    return {
        emergency_active: false,
        override_mode: false
    };
}
