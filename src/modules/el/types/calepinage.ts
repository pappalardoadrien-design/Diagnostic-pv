// Types pour le système de calepinage physique
// Représentation de la disposition réelle des modules sur le toit

export type ModulePosition = {
  identifier: string      // 'S1-1', 'S2-24'
  x: number              // Position X (pixels)
  y: number              // Position Y (pixels)
  rotation?: number      // Rotation en degrés (0 par défaut)
  width?: number         // Largeur (100 par défaut)
  height?: number        // Hauteur (40 par défaut)
}

export type CableConnection = {
  from: string           // 'S1-26' (module source)
  to: string             // 'S2-1' (module destination)
  points?: {x: number, y: number}[]  // Points intermédiaires pour tracé
  color?: string         // Couleur du câble (#dc2626 par défaut)
  arrowType?: 'start' | 'end' | 'both' | 'none'  // Type de flèche
}

export type CablingZone = {
  name?: string          // Nom de la zone
  strings: number[]      // [2, 3, 4] = strings dans cette zone
  borderColor?: string   // Couleur de la bordure (#dc2626 par défaut)
  borderWidth?: number   // Épaisseur bordure (3 par défaut)
  backgroundColor?: string  // Fond (transparent par défaut)
}

export type StringWiring = {
  stringNumber: number
  direction: 'left-to-right' | 'right-to-left'
  moduleCount: number
}

export type PhysicalLayout = {
  projectId: string         // 'JALIBAT-2025-001'
  layoutName: string        // 'JALIBAT - Configuration Toiture'
  
  // Disposition physique des modules
  modules: ModulePosition[]
  
  // Câblage entre strings
  cables: CableConnection[]
  
  // Zones de câblage (rectangles rouges)
  zones?: CablingZone[]
  
  // Configuration du câblage par string
  wiring: StringWiring[]
  
  // Métadonnées de layout
  viewBox?: {
    width: number
    height: number
    gridSize?: number  // Taille de la grille pour alignement
  }
}

export type LayoutWithModuleStates = PhysicalLayout & {
  // États des modules depuis l'audit EL
  moduleStates: {
    identifier: string
    status: 'ok' | 'defect'
    defectType?: string
    severity?: number
  }[]
}
