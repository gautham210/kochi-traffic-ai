export interface VehicleCount {
    cars: number;
    bikes: number;
    buses: number;
    trucks: number;
    autos: number;
}

export type CongestionLevel = 'Low' | 'Medium' | 'High';
export type SignalState = 'RED' | 'YELLOW' | 'GREEN';
export type IncidentType = 'ACCIDENT' | 'ROAD_BLOCK' | 'WATERLOGGING' | 'TREE_FALL' | 'NONE';
export type WeatherCondition = 'Sunny' | 'Rainy' | 'Cloudy' | 'Night';

export interface GeoLocation {
    lat: number;
    lng: number;
}

export interface EnvironmentalMetrics {
    co2_saved_g: number;
    fuel_saved_ml: number;
    idle_time_reduced_s: number;
    trees_equivalent?: number; // New
}

export interface PredictionData {
    next_cycle_congestion_level: CongestionLevel;
    confidence: number;
}

export interface ActiveCorridor {
    ambulance_id: string;
    path: string[];
    active_since: Date;
}

export interface AmbulanceRequest {
    ambulance_id: string;
    current_location: GeoLocation;
    destination: string;
}

export interface Incident {
    id: string;
    junction_id: string;
    type: IncidentType;
    active: boolean;
    timestamp: Date;
    description: string;
}

export interface WeatherData {
    temperature: number;
    humidity: number;
    aqi: number;
    condition: WeatherCondition;
}

export interface Alert {
    id: string;
    timestamp: Date;
    source: 'POLICE' | 'AI_SYSTEM' | 'EMERGENCY_UNIT' | 'CITY_COUNCIL';
    message: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface HistoryEntry {
    timestamp: Date;
    vehicle_count: VehicleCount;
    congestion_level: CongestionLevel;
}

export interface JunctionData {
    id: string;
    vehicle_count: VehicleCount;
    congestion_level: CongestionLevel;
    congestion_score: number;
    signal_state: SignalState;
    green_duration: number;
    emergency_active: boolean;
    override_mode: boolean;
    last_updated: Date;
    history: HistoryEntry[];
    location: GeoLocation;
    environmental_metrics: EnvironmentalMetrics;
    predicted_congestion: PredictionData;

    // New
    current_incident?: Incident;
    weather?: WeatherData;
}

export interface TrafficUpdatePayload {
    junction_id: string;
    vehicle_count: VehicleCount;
    ambulance_detected: boolean;
}
