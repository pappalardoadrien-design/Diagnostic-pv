/**
 * CHECKLISTS GIRASOLE - Mission Janvier-Mars 2025
 * 
 * 2 Types d'audits :
 * 1. CONFORMITE : NF C 15-100 (52 centrales)
 * 2. TOITURE : DTU 40.35 (13 centrales)
 */

export interface ChecklistItemGirasole {
  code: string;
  category: string;
  subcategory: string;
  description: string;
  normReference: string;
  criticalityLevel: 'critical' | 'major' | 'minor' | 'info';
  checkMethod: string;
  conformityOptions: Array<'conforme' | 'non_conforme' | 'sans_objet' | 'non_verifie'>;
}

// ============================================================================
// CHECKLIST CONFORMITE - NF C 15-100 (Installations électriques BT)
// ============================================================================
export const CHECKLIST_CONFORMITE_NFC15100: ChecklistItemGirasole[] = [
  // =========================================================================
  // CATEGORIE 1 : PROTECTIONS ÉLECTRIQUES
  // =========================================================================
  {
    code: 'CONF-01',
    category: 'PROTECTIONS',
    subcategory: 'Protection différentielle',
    description: 'Présence et fonctionnement dispositifs différentiels résiduels (DDR/ID)',
    normReference: 'NF C 15-100 Section 531',
    criticalityLevel: 'critical',
    checkMethod: 'Test bouton TEST + mesure déclenchement',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-02',
    category: 'PROTECTIONS',
    subcategory: 'Protection différentielle',
    description: 'Sélectivité différentielle (30mA type A ou AC)',
    normReference: 'NF C 15-100 Section 531.2',
    criticalityLevel: 'major',
    checkMethod: 'Vérification type et calibre DDR',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-03',
    category: 'PROTECTIONS',
    subcategory: 'Protection surintensités',
    description: 'Présence et dimensionnement disjoncteurs/fusibles',
    normReference: 'NF C 15-100 Section 533',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification calibre vs section câbles',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-04',
    category: 'PROTECTIONS',
    subcategory: 'Protection surintensités',
    description: 'Coordination protection surcharge/court-circuit',
    normReference: 'NF C 15-100 Section 536',
    criticalityLevel: 'major',
    checkMethod: 'Calcul Ik et vérification PdC',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-05',
    category: 'PROTECTIONS',
    subcategory: 'Protection surtensions',
    description: 'Présence parafoudres côté DC et AC',
    normReference: 'NF C 15-100 Section 443 + C15-712-1',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification présence + voyant état',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 2 : MISE À LA TERRE
  // =========================================================================
  {
    code: 'CONF-06',
    category: 'MISE_A_TERRE',
    subcategory: 'Prise de terre',
    description: 'Présence prise de terre + continuité liaison équipotentielle',
    normReference: 'NF C 15-100 Section 542',
    criticalityLevel: 'critical',
    checkMethod: 'Mesure résistance terre < 100Ω',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-07',
    category: 'MISE_A_TERRE',
    subcategory: 'Conducteur protection',
    description: 'Section conducteur PE adaptée (min 6mm² Cu)',
    normReference: 'NF C 15-100 Section 543.1',
    criticalityLevel: 'major',
    checkMethod: 'Vérification section + repérage vert/jaune',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-08',
    category: 'MISE_A_TERRE',
    subcategory: 'Masses métalliques',
    description: 'Interconnexion masses métalliques (structures, châssis onduleur)',
    normReference: 'NF C 15-100 Section 411.3',
    criticalityLevel: 'critical',
    checkMethod: 'Test continuité masses',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 3 : CÂBLAGE ET CONNECTIONS
  // =========================================================================
  {
    code: 'CONF-09',
    category: 'CABLAGE',
    subcategory: 'Câbles DC',
    description: 'Section câbles DC adaptée au courant (min 4mm²)',
    normReference: 'C15-712-1 Section 521',
    criticalityLevel: 'major',
    checkMethod: 'Vérification section vs Isc',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-10',
    category: 'CABLAGE',
    subcategory: 'Câbles DC',
    description: 'Protection mécanique câbles DC (gaine, chemin câbles)',
    normReference: 'C15-712-1 Section 522',
    criticalityLevel: 'major',
    checkMethod: 'Inspection visuelle parcours câbles',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-11',
    category: 'CABLAGE',
    subcategory: 'Câbles AC',
    description: 'Section câbles AC adaptée (protection surcharge)',
    normReference: 'NF C 15-100 Section 524',
    criticalityLevel: 'major',
    checkMethod: 'Vérification section vs calibre protection',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-12',
    category: 'CABLAGE',
    subcategory: 'Connections',
    description: 'Serrage bornes (couple serrage conforme)',
    normReference: 'NF C 15-100 Section 526',
    criticalityLevel: 'critical',
    checkMethod: 'Test traction + vérification couple',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-13',
    category: 'CABLAGE',
    subcategory: 'Connecteurs MC4',
    description: 'État connecteurs MC4 (verrouillage, étanchéité)',
    normReference: 'C15-712-1 Annexe C',
    criticalityLevel: 'major',
    checkMethod: 'Inspection + test traction',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 4 : ÉQUIPEMENTS ÉLECTRIQUES
  // =========================================================================
  {
    code: 'CONF-14',
    category: 'EQUIPEMENTS',
    subcategory: 'Onduleur',
    description: 'Conformité onduleur (marquage CE, raccordement conforme)',
    normReference: 'C15-712-1 Section 712.536',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification marquage + schéma',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-15',
    category: 'EQUIPEMENTS',
    subcategory: 'Interrupteur sectionneur DC',
    description: 'Présence sectionneur DC cadenassable',
    normReference: 'C15-712-1 Section 712.537',
    criticalityLevel: 'critical',
    checkMethod: 'Test fonctionnement + cadenassage',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-16',
    category: 'EQUIPEMENTS',
    subcategory: 'Tableau électrique',
    description: 'Conformité TGBT (IP, indice protection, repérage)',
    normReference: 'NF C 15-100 Section 530',
    criticalityLevel: 'major',
    checkMethod: 'Vérification IP + repérage circuits',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-17',
    category: 'EQUIPEMENTS',
    subcategory: 'Compteur production',
    description: 'Présence et raccordement compteur production',
    normReference: 'C15-712-1 Section 712.513',
    criticalityLevel: 'major',
    checkMethod: 'Vérification présence + scellement',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 5 : SIGNALISATION ET DOCUMENTATION
  // =========================================================================
  {
    code: 'CONF-18',
    category: 'SIGNALISATION',
    subcategory: 'Étiquetage',
    description: 'Étiquetage circuits DC (« Attention tension DC »)',
    normReference: 'C15-712-1 Section 712.514',
    criticalityLevel: 'major',
    checkMethod: 'Vérification présence étiquettes',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-19',
    category: 'SIGNALISATION',
    subcategory: 'Schémas',
    description: 'Présence schémas unifilaires et plans installation',
    normReference: 'NF C 15-100 Section 514.5',
    criticalityLevel: 'major',
    checkMethod: 'Vérification documentation',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'CONF-20',
    category: 'SIGNALISATION',
    subcategory: 'Consignes sécurité',
    description: 'Affichage consignes exploitation et urgence',
    normReference: 'C15-712-1 Section 712.514.3',
    criticalityLevel: 'minor',
    checkMethod: 'Vérification présence consignes',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  }
];

// ============================================================================
// CHECKLIST TOITURE - DTU 40.35 (Couverture en plaques nervurées)
// ============================================================================
export const CHECKLIST_TOITURE_DTU4035: ChecklistItemGirasole[] = [
  // =========================================================================
  // CATEGORIE 1 : ÉTANCHÉITÉ
  // =========================================================================
  {
    code: 'TOIT-01',
    category: 'ETANCHEITE',
    subcategory: 'Couverture',
    description: 'État général couverture (fissures, perforations, déformation)',
    normReference: 'DTU 40.35 Section 5.1',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle toiture',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-02',
    category: 'ETANCHEITE',
    subcategory: 'Couverture',
    description: 'Étanchéité faîtage et rives (capots, closoirs)',
    normReference: 'DTU 40.35 Section 6.3',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle + test pluie',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-03',
    category: 'ETANCHEITE',
    subcategory: 'Percements',
    description: 'Étanchéité percements toiture (fixations, traversées)',
    normReference: 'DTU 40.35 Section 7.2',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection joints + infiltrations',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-04',
    category: 'ETANCHEITE',
    subcategory: 'Joints',
    description: 'État joints longitudinaux et transversaux',
    normReference: 'DTU 40.35 Section 5.3',
    criticalityLevel: 'major',
    checkMethod: 'Inspection étanchéité recouvrements',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 2 : FIXATIONS
  // =========================================================================
  {
    code: 'TOIT-05',
    category: 'FIXATIONS',
    subcategory: 'Fixations couverture',
    description: 'Nombre et répartition fixations (respect DTU)',
    normReference: 'DTU 40.35 Section 5.4',
    criticalityLevel: 'major',
    checkMethod: 'Comptage fixations + vérification plan',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-06',
    category: 'FIXATIONS',
    subcategory: 'Fixations structures PV',
    description: 'Fixations structures PV traversantes (étanchéité + résistance)',
    normReference: 'DTU 40.35 Section 7.2 + DTU 43.1',
    criticalityLevel: 'critical',
    checkMethod: 'Test traction + inspection joints',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-07',
    category: 'FIXATIONS',
    subcategory: 'Visserie',
    description: 'État visserie (corrosion, rondelles, serrage)',
    normReference: 'DTU 40.35 Section 5.4.2',
    criticalityLevel: 'major',
    checkMethod: 'Inspection visuelle + test serrage',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 3 : STRUCTURE PORTEUSE
  // =========================================================================
  {
    code: 'TOIT-08',
    category: 'STRUCTURE',
    subcategory: 'Charpente',
    description: 'État charpente (déformation, flèche, corrosion)',
    normReference: 'DTU 40.35 Section 4.1',
    criticalityLevel: 'critical',
    checkMethod: 'Inspection visuelle + mesure flèche',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-09',
    category: 'STRUCTURE',
    subcategory: 'Pannes',
    description: 'État pannes support couverture (corrosion, déformation)',
    normReference: 'DTU 40.35 Section 4.2',
    criticalityLevel: 'major',
    checkMethod: 'Inspection visuelle pannes',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-10',
    category: 'STRUCTURE',
    subcategory: 'Contreventement',
    description: 'Présence et état contreventements',
    normReference: 'DTU 40.35 Section 4.3',
    criticalityLevel: 'major',
    checkMethod: 'Vérification présence + fixations',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 4 : ÉVACUATION EAUX PLUVIALES
  // =========================================================================
  {
    code: 'TOIT-11',
    category: 'EVACUATION',
    subcategory: 'Pente toiture',
    description: 'Pente toiture suffisante (min 5% DTU 40.35)',
    normReference: 'DTU 40.35 Section 3.1',
    criticalityLevel: 'critical',
    checkMethod: 'Mesure pente + observation écoulement',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-12',
    category: 'EVACUATION',
    subcategory: 'Gouttières',
    description: 'État gouttières et descentes EP (obstruction, fixation)',
    normReference: 'DTU 40.35 Section 6.4',
    criticalityLevel: 'major',
    checkMethod: 'Inspection + test écoulement',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-13',
    category: 'EVACUATION',
    subcategory: 'Stagnation eau',
    description: 'Absence stagnation eau sur toiture',
    normReference: 'DTU 40.35 Section 3.2',
    criticalityLevel: 'major',
    checkMethod: 'Inspection zones basses',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },

  // =========================================================================
  // CATEGORIE 5 : SÉCURITÉ
  // =========================================================================
  {
    code: 'TOIT-14',
    category: 'SECURITE',
    subcategory: 'Accès toiture',
    description: 'Sécurité accès toiture (échelle, garde-corps)',
    normReference: 'DTU 40.35 Section 8.1',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification dispositifs accès',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  },
  {
    code: 'TOIT-15',
    category: 'SECURITE',
    subcategory: 'Lignes de vie',
    description: 'Présence et état lignes de vie / points ancrage',
    normReference: 'Code du travail R4323-89',
    criticalityLevel: 'critical',
    checkMethod: 'Vérification présence + certification',
    conformityOptions: ['conforme', 'non_conforme', 'sans_objet', 'non_verifie']
  }
];

// ============================================================================
// MAPPING AUDIT TYPE → CHECKLIST
// ============================================================================
export function getChecklistByType(auditType: 'CONFORMITE' | 'TOITURE'): ChecklistItemGirasole[] {
  switch (auditType) {
    case 'CONFORMITE':
      return CHECKLIST_CONFORMITE_NFC15100;
    case 'TOITURE':
      return CHECKLIST_TOITURE_DTU4035;
    default:
      throw new Error(`Type audit inconnu: ${auditType}`);
  }
}
