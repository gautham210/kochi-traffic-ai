# System Architecture Summary
**Project:** AI-Assisted Smart Traffic Management System

## 1. High-Level Architecture
The system employs a **Hybrid Edge-Cloud Architecture**, designed for real-time responsiveness and high availability. The core decision-making logic ("Edge AI") runs close to the visualization layer to ensure zero-latency feedback during the simulation, while the backend manages static topology data and serving.

---

## 2. Core Layers

### A. AI & Control Layer (The "Brain")
*   **Physics Engine:** A custom-built saturation flow model (`SAT_FLOW = 2 veh/sec`) that simulates realistic vehicle dynamics, queue accumulation, and discharge rates.
*   **State Machine Orchestrator:**
    *   **Normal Mode:** Standard fixed-cycle operations.
    *   **Optimizing Mode:** Adaptive signal timing based on queue length (>60% load).
    *   **Diverting Mode:** Active traffic rerouting during sustained congestion (>75% load for 15s).
    *   **Emergency Mode:** "Green Corridor" protocol that locks signals and boosts throughput (3x) for priority vehicles.

### B. Visualization Layer (The "Face")
*   **Framework:** HTML5 / CSS3 (Dark Mode, Glassmorphism UI).
*   **Map Engine:** `Leaflet.js` with custom Canvas overlays for rendering thousands of moving vehicle agents efficiently.
*   **Analytics:** Real-time DOM updates for Flow (veh/min), Congestion (%), and Environmental Impact (Fuel/CO2).

### C. Data Layer (The "Backbone")
*   **Graph Topology:** The city is modeled as a directed graph (`kochi_graph.json`) containing:
    *   **Nodes:** Intersections with geospatial coordinates.
    *   **Edges:** Road segments with weight, capacity, and type (Primary/Secondary).
*   **Backend:** Node.js/Express server delivering the simulation environment and data assets.

---

## 3. Data Flow Pipeline

1.  **Sensing (Input):**
    *   Virtual sensors at each junction connect detect `Queue Length` and `Arrival Rate`.
2.  **Processing (Edge AI):**
    *   The **Physics Loop** (1Hz) calculates discharge and saturation.
    *   The **Logic Loop** evaluates thresholds to switch States (e.g., `Normal` -> `Diverting`).
3.  **Actuation (Output):**
    *   **Signal Control:** Phases are locked or adjusted (e.g., Phase 0 Lock in Emergency).
    *   **Rerouting:** Navigation paths for vehicles are dynamically updated to avoid congested edges.
4.  **Visualization:**
    *   The UI receives a 60FPS stream of agent positions and state updates.

---

## 4. Scalability & Future Readiness
*   **Modular Graph:** The system accepts any GeoJSON-based graph, allowing instant adaptation to other cities or larger districts.
*   **Decentralized Logic:** Each junction operates as an independent agent (Autonomous Intersection Management), making the system linearly scalable.
*   **Cloud-Ready:** The current Edge simulation allows for easy offloading of complex prediction tasks (like long-term forecasting) to the backend `aiService` without disrupting real-time operations.

---

## 5. Key Technologies
*   **Frontend:** JavaScript (ES6+), Leaflet, CSS Variables.
*   **Backend:** Node.js, Express.
*   **Algorithms:** Dijkstra (Pathfinding), Saturation Flow (Physics), Finite State Machine (Control).
