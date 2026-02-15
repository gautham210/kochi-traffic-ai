
import { EnvironmentalMetrics } from '../types/trafficTypes';

// Factors (Mock data based on research averages)
// Idle car consumes ~15ml fuel per min
// 1L fuel = ~2.3kg CO2
const FUEL_IDLE_ML_PER_SEC = 0.25;
const CO2_G_PER_ML_FUEL = 2.3;

export function calculateEnvironmentalImpact(vehicleCount: number, savedTimeSeconds: number): EnvironmentalMetrics {
    // Logic: "Saved Time" is time NOT spent idling due to optimization.
    // For hackathon, we assume 20% of green duration is "saved" vs static timer.

    // Total fuel saved for all vehicles
    const totalFuelSaved = vehicleCount * savedTimeSeconds * FUEL_IDLE_ML_PER_SEC;
    const totalCO2Saved = totalFuelSaved * CO2_G_PER_ML_FUEL;

    return {
        fuel_saved_ml: parseFloat(totalFuelSaved.toFixed(2)),
        co2_saved_g: parseFloat(totalCO2Saved.toFixed(2)),
        idle_time_reduced_s: parseFloat((vehicleCount * savedTimeSeconds).toFixed(2))
    };
}
