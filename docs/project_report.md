# AI-Assisted Smart Traffic Management System - Technical Report

**Generated:** 2026-02-16
**Version:** 1.0 (Demo Phase)
**Workspace:** `AI-Assisted Smart Traffic Management System for Kochi`

---

## 1. Full Tech Stack

### Frontend (Visualization & Simulation Layer)
*   **Core:** HTML5, CSS3 (Variables, Flexbox/Grid), Vanilla JavaScript (ES6+).
*   **Mapping:** `Leaflet.js` (v1.9.4) with `CartoDB Dark Matter` tiles.
*   **Rendering:** Custom `HTML5 Canvas` Overlay for high-performance agent rendering (60 FPS).
*   **Charting:** `Chart.js` (loaded via CDN).
*   **Icons:** FontAwesome 6.

### Backend (API & Data Layer)
*   **Runtime:** Node.js (v20+ recommended).
*   **Framework:** Express.js (v5.2.1).
*   **Language:** TypeScript (v5.9.3).
*   **Utilities:** `cors` (Cross-Origin Resource Sharing), `dotenv` (Configuration).

### Data & Storage
*   **Topology:** `kochi_graph.json` (Static GeoJSON-like structure).
*   **State Management:** In-Memory `TrafficStore` (Singleton Pattern).
*   **Persistence:** Ephemeral (Resets on restart).

---

## 2. Architecture Overview

The system implements a **Thick Client / Smart Edge Architecture**.

*   **Tier 1: The Smart Edge (Frontend)**
    *   **Responsibility:** Runs the core physics simulation, decision-making logic (AI), and visualization. It acts as a "Digital Twin" of the city.
    *   **Reasoning:** Eliminates network latency for real-time traffic signal switching and smooth vehicle animation.

*   **Tier 2: The API Server (Backend)**
    *   **Responsibility:** Serves the application, manages static assets, and provides a suite of REST APIs for external integration (`/api/analyze-traffic`, `/api/incident`).
    *   **Status:** In the current demo, the frontend operates autonomously using downloaded topology data, while validity of the backend endpoints allows for future extension to real sensors.

---

## 3. Core Modules

### A. Frontend Logic (`dashboard.html`)
*   **Physics Loop (`physicsTick`)**: Runs at 1Hz. Calculates queue buildup, discharge rates, and conservation of flow.
*   **Animation Loop (`loop`)**: Runs at 60Hz via `requestAnimationFrame`. Interpolates vehicle positions for smooth movement.
*   **State Machine (`updateStateMachine`)**: Evaluates congestion metrics to switch junctions between `NORMAL`, `OPTIMIZING`, `DIVERTING`, and `EMERGENCY` modes.
*   **Graph Engine**: Parses nodes/edges and manages the connectivity graph for vehicle pathfinding.

### B. Backend Services (`src/services/`)
*   **`simulationService.ts`**: A server-side statistical simulator that updates congestion scores based on time-of-day curves. (Available for API consumers).
*   **`aiService.ts`**: Rule-based engine that generates natural language insights based on junction metrics (e.g., "Heavy traffic due to morning peak").
*   **`congestionEngine.ts`**: Calculates congestion levels (Low/Med/High) from raw vehicle counts.
*   **`trafficRoutes.ts`**: Express router defining the API surface.

---

## 4. Data Flow (Frontend Simulation Pipeline)

1.  **Initialization**:
    *   Frontend fetches `/data/kochi_graph.json`.
    *   Builds specialized graph: `Nodes` (Junctions) and `Edges` (Roads).
    *   Spawns `300` autonomous `Vehicle` agents.

2.  **Per-Frame Update**:
    *   **Movement**: Vehicles advance along edges based on `speed * dt`.
    *   **Stop Logic**: Vehicles brake if `progress > 0.85` and light is `RED`.

3.  **Physics Tick (1s Interval)**:
    *   **Sensing**: Counts `Arrivals` at each junction.
    *   **Discharge**: `Discharged = min(Queue, SaturationFlow * GreenTime)`.
    *   **Metric Update**: Updates `Flow (veh/min)` and `Congestion (%)`.

4.  **Control Decision**:
    *   Evaluates `Congestion %`.
    *   If `Load > 75%` (for 15s) → Trigger `DIVERTING`.
    *   If `Emergency` Active → Trigger `green_wave`.

5.  **Rendering**:
    *   Canvas clears and redraws all vehicles.
    *   DOM elements update text metrics.

---

## 5. Control Logic

### Congestion Calculation
*   **Formula:** `Utilization % = (CurrentQueue / Capacity) * 100`
*   **Capacity:** Fixed at `300` vehicles per junction for the demo.
*   **City-Wide:** Average of all individual junction utilization percentages.

### Signal Timing
*   **Fixed Time:** Standard cycle (e.g., 30s Green).
*   **Optimizing Mode:** Extends Green time dynamically when `Load > 60%`.
*   **Emergency Override:** Locks `ActivePhase` to `0` and sets state to `EMERGENCY`.

### Hysteresis (Stability)
To prevent flickering between states:
*   **Entry:** Must exceed threshold for `15 seconds`.
*   **Exit:** Must fall below threshold for `20 seconds`.
*   **Ramping:** Diversion percentage scales linearly (`0%` -> `40%`) using a lerp function (`0.05` factor).

---

## 6. Simulation Engine Details

The simulation is **Microscopic** and **Time-Stepped**.

*   **Physics Model:** Saturation Flow.
    *   `SAT_FLOW = 2 veh/sec/lane`.
    *   `Emergency Flow = 6 veh/sec` (Boosted).
*   **Vehicle Model:**
    *   **Car Following:** Simplified (Stop-and-Go).
    *   **Pathfinding:** pre-calculated Dijkstra or random walk.
    *   **Speed:**
        *   Normal: `1.0x`
        *   Emergency Primary: `1.4x`
        *   Emergency Secondary: `0.6x`

---

## 7. Map & GIS System

*   **Initialization:** Leaflet map centered on Kochi (`9.9950, 76.3100`).
*   **Tiles:** Dark Matter (CartoDB) for high-contrast UI.
*   **Road Rendering:**
    *   Polyline layers drawn from graph edges.
    *   **Primary Roads:** Cyan (`#00bcd4`), thicker weight.
    *   **Secondary Roads:** White/Grey.
*   **Overlay:** A single `<canvas>` element covers the map. It syncs with map pan/zoom events to re-project lat/lng coordinates to screen pixels for vehicle drawing.

---

## 8. Real vs. Simulated Components

| Component | Status | Description |
| :--- | :--- | :--- |
| **Graph Topology** | **REAL** | Coordinates match real Kochi intersections (Vyttila, Edappally). |
| **Logic Rules** | **REAL** | Standard traffic engineering logic (Saturation flow, Hysteresis). |
| **Vehicles** | **SIMULATED** | 300 agents generated by the client. |
| **Sensor Data** | **SIMULATED** | "Arrivals" are derived from virtual agent positions. |
| **Signals** | **SIMULATED** | Visual representations of phase timers. |

---

## 9. Scalability Design

*   **Graph Independence:** The logic engine is agnostic to the map. Adding a new junction requires only adding a Node/Edge entry to `kochi_graph.json`.
*   **O(N) Complexity:** The logic loop iterates linearly over junctions. JavaScript engines can handle ~5,000 agents and ~500 junctions at 60FPS before optimization is needed.
*   **Backend Readiness:** The `TrafficStore` and API structure are ready to accept real MQTT/HTTP feeds from physical cameras, replacing the `simulationService` inputs.

---

## 10. Run Instructions

### Prerequisites
*   Node.js installed.

### 1. Setup
```bash
cd backend
npm install
```

### 2. Start Backend & Server
```bash
# Development Mode (with hot-reload)
npm run dev
# OR Production Mode
npm run build
npm start
```
*Port:* `3000` (Default)

### 3. Access Application
Open Browser: `http://localhost:3000`

*The frontend is statically served by the backend. No separate frontend server is required.*
