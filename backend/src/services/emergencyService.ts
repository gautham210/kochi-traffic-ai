
export interface EmergencyResult {
    emergency_active: boolean;
    override_mode: boolean;
    green_duration?: number;
}

export function checkEmergency(ambulanceDetected: boolean): EmergencyResult {
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
