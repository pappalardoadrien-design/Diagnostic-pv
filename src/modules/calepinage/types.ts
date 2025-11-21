// Types pour le module Calepinage Universel
// Système réutilisable pour EL, I-V, Diodes, Thermographie, etc.

export type ModuleType = 'el' | 'iv' | 'diodes' | 'thermique' | 'isolation' | 'visual'

export type ModulePosition = {
  identifier: string      // 'S1-1', 'S2-24'
  x: number              // Position X (pixels ou %)
  y: number              // Position Y (pixels ou %)
  width?: number         // Largeur (défaut: 60)
  height?: number        // Hauteur (défaut: 35)
  rotation?: number      // Rotation en degrés (défaut: 0)
}

export type WiringArrow = {
  id: string             // Identifiant unique
  stringNumber: number   // Numéro de string
  startX: number        // Point de départ X
  startY: number        // Point de départ Y
  endX: number          // Point d'arrivée X
  endY: number          // Point d'arrivée Y
  color?: string        // Couleur (défaut: #dc2626)
  width?: number        // Épaisseur (défaut: 4)
  label?: string        // Label (ex: 'S1')
}

export type CablingZone = {
  id: string            // Identifiant unique
  name?: string         // Nom de la zone
  x: number            // Position X
  y: number            // Position Y
  width: number        // Largeur
  height: number       // Hauteur
  borderColor?: string // Couleur bordure (défaut: #dc2626)
  borderWidth?: number // Épaisseur bordure (défaut: 3)
  borderStyle?: 'solid' | 'dashed'  // Style (défaut: dashed)
  backgroundColor?: string  // Fond (défaut: transparent)
}

export type CalepinageLayout = {
  id?: number           // ID en base D1
  projectId: string     // 'JALIBAT-2025-001'
  moduleType: ModuleType  // Type de module source
  layoutName: string    // Nom descriptif
  
  // Configuration canvas
  viewBox: {
    width: number
    height: number
    gridSize?: number  // Taille grille pour snap (défaut: 20)
  }
  
  // Positions des modules
  modules: ModulePosition[]
  
  // Flèches de câblage
  arrows: WiringArrow[]
  
  // Zones de câblage
  zones: CablingZone[]
  
  // Métadonnées
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export type EditorMode = 'select' | 'move' | 'arrow' | 'zone'

export type EditorState = {
  mode: EditorMode
  selectedItem: {
    type: 'module' | 'arrow' | 'zone' | null
    id: string | null
  }
  zoom: number          // Niveau de zoom (0.5 - 2.0)
  gridSnap: boolean     // Snap to grid activé
  showGrid: boolean     // Afficher la grille
}

export type LayoutTemplate = {
  id: string
  name: string
  description: string
  stringCount: number
  modulesPerString: number
  previewImage?: string
  layout: CalepinageLayout
}

// API Responses
export type LayoutListResponse = {
  success: boolean
  layouts: CalepinageLayout[]
  total: number
}

export type LayoutResponse = {
  success: boolean
  layout: CalepinageLayout
}

export type SaveLayoutRequest = {
  projectId: string
  moduleType: ModuleType
  layoutName: string
  layout: CalepinageLayout
}

export type SaveLayoutResponse = {
  success: boolean
  layoutId: number
  message: string
}
