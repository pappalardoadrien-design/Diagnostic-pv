/**
 * CHECKLIST IEC 62446-1 - Inspection Visuelle Terrain
 * Norme internationale pour controle qualite installations PV
 * 
 * Categories:
 * - MECHANICAL: Modules, structures, cablage mecanique
 * - ELECTRICAL: Protections, mise a terre, boites jonction
 * - DOCUMENTATION: Plans, schemas, etiquetage
 * - SAFETY: Signalisation, acces, risques
 */

export interface ChecklistItem {
  code: string;
  category: 'MECHANICAL' | 'ELECTRICAL' | 'DOCUMENTATION' | 'SAFETY';
  subcategory: string;
  description: string;
  normReference: string;
  criticalityLevel: 'critical' | 'major' | 'minor' | 'info';
  checkMethod: string;
}

export const IEC_62446_CHECKLIST: ChecklistItem[] = [
  // =========================================================================
  // CATEGORY 1: MECHANICAL - Composants mecaniques et structures
  // =========================================================================
  {
    code: 'M01',
    category: 'MECHANICAL',
    subcategory: 'Modules PV',
    description: 'Integrite mecanique modules (fissures, impacts, delamination)',
    normReference: 'IEC 62446-1 Section 6.1',
    criticalityLevel: 'major',
    checkMethod: 'Inspection visuelle rapprochee'
  },
  {
    code: 'M02',
    category: 'MECHANICAL',
    subcategory: 'Modules PV',
    description: 'Etat cadre aluminium (corrosion, deformation)',
    normReference: 'IEC 62446-1 Section 6.1',
    criticalityLevel: 'minor',
    checkMethod: 'Inspection visuelle'
  },
  {
    code: 'M03',
    category: 'MECHANICAL',
    subcategory: 'Modules PV',
    description: 'Etat verre frontal (proprete, opacite, salissures)',
    normReference: 'IEC 62446-1 Section 6.1',
    criticalityLevel: 'minor',
    checkMethod: 'Inspection visuelle'
  },
  {
    code: 'M04',
    category: 'MECHANICAL',
    subcategory: 'Modules PV',
    description: 'Etat backsheet (decoloration, decollement, degradation)',
    normReference: 'IEC 62446-1 Section 6.1',
    criticalityLevel: 'major',
    checkMethod: 'Inspection visuelle arriere modules'
  },
  {
    code: 'M05',
    category: 'MECHANICAL',
    subcategory: 'Modules PV',
    description: 'Etat boite jonction module (etancheite, fixation, corrosion)',
    normReference: 'IEC 62446-1 Section 6.1',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle + test fermeture'
  },
  {
    code: 'M06',
    category: 'MECHANICAL',
    subcategory: 'Modules PV',
    description: 'Etat connecteurs MC4 (usure, corrosion, verrouillage)',
    normReference: 'IEC 62446-1 Section 6.1',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle + test traction'
  },
  {
    code: 'M07',
    category: 'MECHANICAL',
    subcategory: 'Structures',
    description: 'Fixations modules sur rails (serrage, corrosion)',
    normReference: 'IEC 62446-1 Section 6.2',
    criticalityLevel: 'major',
    checkMethod: 'Inspection visuelle + test serrage'
  },
  {
    code: 'M08',
    category: 'MECHANICAL',
    subcategory: 'Structures',
    description: 'Etat structures porteuses (corrosion, deformation, stabilite)',
    normReference: 'IEC 62446-1 Section 6.2',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle structures'
  },
  {
    code: 'M09',
    category: 'MECHANICAL',
    subcategory: 'Structures',
    description: 'Ancrage toiture ou sol (fixation, etancheite)',
    normReference: 'IEC 62446-1 Section 6.2',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection points fixation'
  },
  {
    code: 'M10',
    category: 'MECHANICAL',
    subcategory: 'Cablage',
    description: 'Etat cables DC (protection UV, usure, ecrasement)',
    normReference: 'IEC 62446-1 Section 6.3',
    criticalityLevel: 'major',
    checkMethod: 'Inspection trajet cables'
  },
  {
    code: 'M11',
    category: 'MECHANICAL',
    subcategory: 'Cablage',
    description: 'Chemin cables (protection mecanique, separation DC/AC)',
    normReference: 'IEC 62446-1 Section 6.3',
    criticalityLevel: 'major',
    checkMethod: 'Inspection chemins cables'
  },
  {
    code: 'M12',
    category: 'MECHANICAL',
    subcategory: 'Cablage',
    description: 'Colliers serrage cables (etat, espacement, fixation)',
    normReference: 'IEC 62446-1 Section 6.3',
    criticalityLevel: 'minor',
    checkMethod: 'Inspection visuelle'
  },

  // =========================================================================
  // CATEGORY 2: ELECTRICAL - Equipements electriques et protections
  // =========================================================================
  {
    code: 'E01',
    category: 'ELECTRICAL',
    subcategory: 'Boites Jonction',
    description: 'Etat boites jonction DC (etancheite, acces, fixation)',
    normReference: 'IEC 62446-1 Section 6.4',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle + ouverture'
  },
  {
    code: 'E02',
    category: 'ELECTRICAL',
    subcategory: 'Boites Jonction',
    description: 'Connexions internes boites (serrage, corrosion)',
    normReference: 'IEC 62446-1 Section 6.4',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection interieur boites'
  },
  {
    code: 'E03',
    category: 'ELECTRICAL',
    subcategory: 'Boites Jonction',
    description: 'Presence fusibles/disjoncteurs par string',
    normReference: 'NF C 15-100 Section 712',
    criticalityLevel: 'critical',
    checkMethod: 'Verification protections'
  },
  {
    code: 'E04',
    category: 'ELECTRICAL',
    subcategory: 'Mise Terre',
    description: 'Continuite mise terre structures metalliques',
    normReference: 'IEC 62446-1 Section 6.5',
    criticalityLevel: 'critical',
    checkMethod: 'Verification liaisons equipotentielles'
  },
  {
    code: 'E05',
    category: 'ELECTRICAL',
    subcategory: 'Mise Terre',
    description: 'Connexions terre (serrage, corrosion, section cables)',
    normReference: 'IEC 62446-1 Section 6.5',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle connexions'
  },
  {
    code: 'E06',
    category: 'ELECTRICAL',
    subcategory: 'Onduleurs',
    description: 'Etat general onduleurs (fixation, ventilation, acces)',
    normReference: 'IEC 62446-1 Section 6.6',
    criticalityLevel: 'major',
    checkMethod: 'Inspection visuelle onduleurs'
  },
  {
    code: 'E07',
    category: 'ELECTRICAL',
    subcategory: 'Onduleurs',
    description: 'Affichage onduleurs (erreurs, production, parametres)',
    normReference: 'IEC 62446-1 Section 6.6',
    criticalityLevel: 'major',
    checkMethod: 'Verification ecrans onduleurs'
  },
  {
    code: 'E08',
    category: 'ELECTRICAL',
    subcategory: 'Protections',
    description: 'Presence sectionneurs DC (accessibilite, identification)',
    normReference: 'NF C 15-100 Section 712',
    criticalityLevel: 'critical',
    checkMethod: 'Verification sectionneurs'
  },
  {
    code: 'E09',
    category: 'ELECTRICAL',
    subcategory: 'Protections',
    description: 'Presence parafoudres DC/AC (etat, voyants)',
    normReference: 'NF C 15-100 Section 712',
    criticalityLevel: 'major',
    checkMethod: 'Verification parafoudres'
  },
  {
    code: 'E10',
    category: 'ELECTRICAL',
    subcategory: 'Protections',
    description: 'Presence disjoncteur differentiel AC (30mA)',
    normReference: 'NF C 15-100 Section 712',
    criticalityLevel: 'critical',
    checkMethod: 'Verification tableau electrique'
  },

  // =========================================================================
  // CATEGORY 3: DOCUMENTATION - Plans, schemas et etiquetage
  // =========================================================================
  {
    code: 'D01',
    category: 'DOCUMENTATION',
    subcategory: 'Plans',
    description: 'Presence plan implantation modules sur site',
    normReference: 'IEC 62446-1 Section 7.1',
    criticalityLevel: 'major',
    checkMethod: 'Verification documentation'
  },
  {
    code: 'D02',
    category: 'DOCUMENTATION',
    subcategory: 'Schemas',
    description: 'Presence schema unifilaire installation',
    normReference: 'IEC 62446-1 Section 7.1',
    criticalityLevel: 'major',
    checkMethod: 'Verification documentation'
  },
  {
    code: 'D03',
    category: 'DOCUMENTATION',
    subcategory: 'Schemas',
    description: 'Presence schema connexions DC (strings, boites)',
    normReference: 'IEC 62446-1 Section 7.1',
    criticalityLevel: 'major',
    checkMethod: 'Verification documentation'
  },
  {
    code: 'D04',
    category: 'DOCUMENTATION',
    subcategory: 'Etiquetage',
    description: 'Etiquetage cables DC (polarite +/-, identification strings)',
    normReference: 'IEC 62446-1 Section 7.2',
    criticalityLevel: 'major',
    checkMethod: 'Verification etiquettes cables'
  },
  {
    code: 'D05',
    category: 'DOCUMENTATION',
    subcategory: 'Etiquetage',
    description: 'Etiquetage boites jonction (identification, tension max)',
    normReference: 'IEC 62446-1 Section 7.2',
    criticalityLevel: 'major',
    checkMethod: 'Verification etiquettes boites'
  },
  {
    code: 'D06',
    category: 'DOCUMENTATION',
    subcategory: 'Etiquetage',
    description: 'Etiquetage onduleurs (puissance, strings connectes)',
    normReference: 'IEC 62446-1 Section 7.2',
    criticalityLevel: 'minor',
    checkMethod: 'Verification etiquettes onduleurs'
  },
  {
    code: 'D07',
    category: 'DOCUMENTATION',
    subcategory: 'Signalisation',
    description: 'Presence etiquette "Installation photovoltaique"',
    normReference: 'NF C 15-100 Section 712',
    criticalityLevel: 'major',
    checkMethod: 'Verification signalisation generale'
  },
  {
    code: 'D08',
    category: 'DOCUMENTATION',
    subcategory: 'Signalisation',
    description: 'Presence etiquette "Danger haute tension DC"',
    normReference: 'NF C 15-100 Section 712',
    criticalityLevel: 'critical',
    checkMethod: 'Verification signalisation securite'
  },

  // =========================================================================
  // CATEGORY 4: SAFETY - Securite acces et risques
  // =========================================================================
  {
    code: 'S01',
    category: 'SAFETY',
    subcategory: 'Acces',
    description: 'Securisation acces toiture (gardes-corps, echelles)',
    normReference: 'Code du Travail R4323',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection acces site'
  },
  {
    code: 'S02',
    category: 'SAFETY',
    subcategory: 'Acces',
    description: 'Presence ligne vie ou points ancrage EPI',
    normReference: 'Code du Travail R4323',
    criticalityLevel: 'critical',
    checkMethod: 'Verification equipements securite'
  },
  {
    code: 'S03',
    category: 'SAFETY',
    subcategory: 'Risques',
    description: 'Absence ombrage permanent sur modules (arbres, batiments)',
    normReference: 'IEC 62446-1 Section 8',
    criticalityLevel: 'minor',
    checkMethod: 'Observation environnement'
  },
  {
    code: 'S04',
    category: 'SAFETY',
    subcategory: 'Risques',
    description: 'Absence vegetation envahissante sous modules',
    normReference: 'IEC 62446-1 Section 8',
    criticalityLevel: 'minor',
    checkMethod: 'Inspection vegetation'
  },
  {
    code: 'S05',
    category: 'SAFETY',
    subcategory: 'Incendie',
    description: 'Presence extincteurs adaptes (classe C electrique)',
    normReference: 'Reglementation incendie',
    criticalityLevel: 'major',
    checkMethod: 'Verification extincteurs'
  },
  {
    code: 'S06',
    category: 'SAFETY',
    subcategory: 'Incendie',
    description: 'Coupure urgence accessible pompiers (sectionneurs)',
    normReference: 'NF C 15-100 Section 712',
    criticalityLevel: 'critical',
    checkMethod: 'Verification accessibilite coupure'
  }
];

/**
 * Obtenir items checklist par categorie
 */
export function getChecklistByCategory(category: ChecklistItem['category']): ChecklistItem[] {
  return IEC_62446_CHECKLIST.filter(item => item.category === category);
}

/**
 * Obtenir items critiques uniquement
 */
export function getCriticalItems(): ChecklistItem[] {
  return IEC_62446_CHECKLIST.filter(item => item.criticalityLevel === 'critical');
}

/**
 * Statistiques checklist
 */
export function getChecklistStats() {
  return {
    total: IEC_62446_CHECKLIST.length,
    byCategory: {
      MECHANICAL: getChecklistByCategory('MECHANICAL').length,
      ELECTRICAL: getChecklistByCategory('ELECTRICAL').length,
      DOCUMENTATION: getChecklistByCategory('DOCUMENTATION').length,
      SAFETY: getChecklistByCategory('SAFETY').length
    },
    byCriticality: {
      critical: IEC_62446_CHECKLIST.filter(i => i.criticalityLevel === 'critical').length,
      major: IEC_62446_CHECKLIST.filter(i => i.criticalityLevel === 'major').length,
      minor: IEC_62446_CHECKLIST.filter(i => i.criticalityLevel === 'minor').length,
      info: IEC_62446_CHECKLIST.filter(i => i.criticalityLevel === 'info').length
    }
  };
}
