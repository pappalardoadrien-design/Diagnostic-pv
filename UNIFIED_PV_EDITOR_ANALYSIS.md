# UNIFIED PV EDITOR ANALYSIS & RECOMMENDATION

## 1. Analysis of Existing Modules

We have identified three distinct modules with overlapping but complementary purposes:

### A. Schematic Editor V2 ("The Architect")
- **URL**: `/api/calepinage/editor/:projectId` (linked as "V2 PRO")
- **Source**: `src/modules/calepinage/routes/editor.ts`
- **Type**: Logical/Schematic Diagramming
- **Data Model**: `calepinage_layouts` (JSON Blob) + `el_modules` (Source)
- **Key Features**:
  - Drag & Drop sidebar with modules grouped by String.
  - Infinite Canvas (ViewBox).
  - Arrow drawing (wiring logic).
  - Zone drawing (logical grouping).
  - **Strength**: Perfect for defining the electrical/logical structure and stringing layout.
  - **Weakness**: Disconnected from physical geography; data stored as a JSON blob (hard to query individually).

### B. Static Editor V1 ("The Sketchpad")
- **URL**: `/static/pv/editor.html`
- **Source**: `public/static/pv/editor.html`
- **Type**: Visual Module Status Manager
- **Data Model**: `/api/pv/plants/.../modules` (Individual Records)
- **Key Features**:
  - Manual Grid Generation.
  - Background Image Upload (e.g., drone photo underlay).
  - Visualizing EL Status (colors).
  - **Strength**: Simple, quick visual feedback, background image support.
  - **Weakness**: Legacy implementation, client-side heavy, separate from the sophisticated V2 logic.

### C. Designer Satellite ("The Geographer")
- **URL**: `/pv/plant/.../designer`
- **Source**: `src/modules/designer/routes/designer-map.ts`
- **Type**: GIS/Satellite Mapping
- **Data Model**: `pv_modules` (Lat/Lon) + `el_modules` (Sync)
- **Key Features**:
  - Google Satellite Layer via Leaflet.
  - Roof Polygon Drawing (Leaflet.draw) + Turf.js Area Calculation.
  - "Place Modules in Polygon" (Geospatial algorithm).
  - Address Search (Nominatim).
  - **Strength**: True physical positioning, area estimation, remote assessment.
  - **Weakness**: Cannot easily represent complex electrical stringing (serpentin arrows) or non-geographic logical layouts.

## 2. The "Perfect Version" Vision

To achieve the "Number One Platform" goal, we must **unify** these three into a single, cohesive **Digital Twin Interface**. We should not lose functionality but rather layer them.

**Target Architecture: "The Unified Digital Twin Editor"**

### Core Concept
A single page application with two primary **View Modes**:
1.  **🌍 Map View (Satellite)**: Based on `Designer Satellite`. Focus on Lat/Lon, physical constraints, roof areas.
2.  **📐 Schematic View (Logical)**: Based on `Editor V2`. Focus on electrical strings, cabling (arrows), and clear block diagrams.

### Unified Data Strategy (Migration 0030 Compliant)
Instead of disparate tables (`calepinage_layouts` vs `pv_modules`), we will utilize the new **`plant_topology`** table as the **Single Source of Truth**.

- **`plant_topology` Table**:
  - `module_identifier` (Shared ID)
  - `string_number`, `string_position` (Electrical Logic)
  - `physical_lat`, `physical_lon`, `physical_rotation` (Satellite Data)
  - `schematic_x`, `schematic_y`, `schematic_rotation` (Canvas Data)
  - `status` (EL/Diagnosis Status)

### Functional Merge Plan

1.  **Enhance Schematic V2**:
    -   Add "Background Image" feature from V1 (critical for non-geolocated drone overlays).
    -   Add "Grid Generator" from V1 (faster than dragging one by one).
    -   Add "Sync from Map" button (to auto-arrange based on lat/lon relative positions).

2.  **Integrate Satellite Designer**:
    -   Keep the robust Leaflet logic.
    -   Ensure "Save" writes to `physical_lat/lon` columns in `plant_topology`.

3.  **Retire Static V1**:
    -   Once V2 has "Background Image" and "Grid Gen", V1 is obsolete.

## 3. Implementation Roadmap

1.  **Database Migration**: Ensure `plant_topology` has columns for both Physical (Lat/Lon) and Schematic (X/Y) coordinates.
2.  **API Unification**: Create a `UnifiedTopologyService` that serves data to both views.
3.  **UI/UX**:
    -   Create a master Layout wrapper.
    -   Tabs: [ 🌍 Carte Satellite ] [ 📐 Schéma Électrique ] [ 📊 Liste Modules ]
    -   Shared Toolbar: Status filters, Global Actions (Sync EL, Export PDF).
4.  **Preservation**:
    -   Existing V2 code moves to `src/modules/unified-editor/views/schematic.ts`.
    -   Existing Designer code moves to `src/modules/unified-editor/views/satellite.ts`.

## 4. Immediate Action Items
-   **Do not delete** any code yet.
-   **Archive** `public/static/pv/editor.html` logic into a reusable component for V2.
-   **Refactor** `src/modules/calepinage/routes/editor.ts` to read/write to `plant_topology` instead of `calepinage_layouts`.
