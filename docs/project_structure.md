# Project Directory Structure

```graphql
backend/
├── dist/                          # Compiled JavaScript files (Production)
├── node_modules/                  # Node.js dependencies
├── public/
│   ├── data/
│   │   ├── kochi_graph.json       # Graph Topology (Nodes & Edges)
│   │   └── kochi_roads.json       # Raw Road geometry
│   └── dashboard.html             # MAIN APPLICATION (Frontend Logic + UI)
├── src/
│   ├── config/
│   │   └── deploymentConfig.ts    # Deployment settings & architecture info
│   ├── routes/
│   │   └── trafficRoutes.ts       # API Endpoint Definitions
│   ├── services/
│   │   ├── aiService.ts           # AI Insight Generator (Natural Language)
│   │   ├── congestionEngine.ts    # Core Congestion Logic (Score Calculation)
│   │   ├── emergencyService.ts    # Basic Emergency Flag Logic
│   │   ├── environmentalImpact.ts # CO2/Fuel Savings Calculator
│   │   ├── gpsEmergencyService.ts # GPS-based Ambulance Tracking Logic
│   │   ├── incidentService.ts     # Accident/Incident Management
│   │   ├── predictionService.ts   # Future Traffic Prediction (Mock)
│   │   ├── routeOptimizer.ts      # Alternate Route Calculation (Dijkstra)
│   │   ├── signalOptimizer.ts     # Green Light Duration Logic
│   │   ├── simulationService.ts   # Backend Statistical Simulation Engine
│   │   ├── summaryGenerator.ts    # Daily Report Generator
│   │   └── weatherService.ts      # Mock Weather Data Provider
│   ├── store/
│   │   └── trafficStore.ts        # In-Memory State Management (Singleton)
│   ├── types/
│   │   └── trafficTypes.ts        # TypeScript Interfaces & Types
│   └── server.ts                  # Express Server Entry Point
├── package.json                   # Backend Dependencies & Scripts
├── package-lock.json              # Dependency Lock File
└── tsconfig.json                  # TypeScript Configuration

vision/
├── venv/                          # Python Virtual Environment
├── __pycache__/                   # Python Bytecode Cache
├── vision.py                      # YOLOv8 Computer Vision Script
├── yolov8n.pt                     # YOLO Nano Model (Weights)
├── yolov8s.pt                     # YOLO Small Model (Weights)
├── vyttila.mp4                    # Reference Video (Vyttila)
├── edappally.mp4                  # Reference Video (Edappally)
├── palarivattom.mp4               # Reference Video (Palarivattom)
├── kakkanad.mp4                   # Reference Video (Kakkanad)
├── requirements.txt               # Python Dependencies
└── run_vision_gpu.bat             # Batch script to run Vision System

frontend/                          # (Empty Directory - Deprecated/Placeholder)

README.md                          # Project Documentation
requirements.txt                   # Root Level Python Requirements (if any)
```
