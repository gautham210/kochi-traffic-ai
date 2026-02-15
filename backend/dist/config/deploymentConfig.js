"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemArchitecture = exports.deploymentConfig = void 0;
exports.deploymentConfig = {
    hardware: {
        works_with_existing_cctv: true,
        min_resolution: "720p",
        edge_ai_supported: true
    },
    cloud: {
        provider: "AWS/GCP/Azure",
        deployment_ready: true,
        docker_support: true
    },
    cost: {
        estimated_cost_per_junction_usd: 500, // cheap edge device
        software_license: "Open Source / SaaS"
    },
    pilot_plan: {
        phase_1: "Vyttila Junction Pilot (1 Month)",
        phase_2: "Corridor Expansion (5 Junctions - 3 Months)",
        phase_3: "City-Wide Grid (Kochi 50+ Junctions - 1 Year)"
    }
};
exports.systemArchitecture = {
    layers: [
        {
            name: "Input Layer",
            components: ["CCTV Feeds", "GPS Emergency Data", "Inductive Loops (Legacy)"]
        },
        {
            name: "AI Processing Layer",
            components: ["YOLOv8 Vision Engine", "Traffic Pattern Recognition", "Route Optimization"]
        },
        {
            name: "Control Layer",
            components: ["Adaptive Signal Controller", "Emergency Override System", "Central Command Store"]
        },
        {
            name: "Presentation Layer",
            components: ["Admin Dashboard", "Public API", "Mobile App Notifications"]
        }
    ]
};
