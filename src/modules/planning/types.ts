// Types pour module Planning & Attribution
// Table: interventions (déjà créée en DB)

export type InterventionType = 
  | 'el_audit'           // Audit électroluminescence
  | 'iv_test'            // Test courbes I-V
  | 'thermography'       // Thermographie infrarouge
  | 'visual_inspection'  // Inspection visuelle
  | 'isolation_test'     // Test isolation
  | 'post_incident'      // Expertise post-sinistre
  | 'commissioning'      // Commissioning
  | 'maintenance';       // Maintenance préventive

export type InterventionStatus = 
  | 'scheduled'    // Planifiée
  | 'in_progress'  // En cours
  | 'completed'    // Terminée
  | 'cancelled';   // Annulée

export interface Intervention {
  id: number;
  project_id: number;
  technician_id: number | null;
  intervention_type: InterventionType;
  notes: string | null;
  intervention_date: string; // ISO date YYYY-MM-DD
  duration_hours: number | null;
  status: InterventionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterventionWithDetails extends Intervention {
  // Relations jointes
  project_name?: string;
  project_location?: string;
  client_name?: string;
  technician_name?: string;
  technician_email?: string;
}

export interface CreateInterventionRequest {
  project_id: number;
  intervention_type: InterventionType;
  notes?: string;
  intervention_date: string; // ISO date YYYY-MM-DD
  duration_hours?: number;
  notes?: string;
}

export interface UpdateInterventionRequest {
  intervention_type?: InterventionType;
  notes?: string;
  intervention_date?: string;
  duration_hours?: number;
  status?: InterventionStatus;
  notes?: string;
}

export interface AssignTechnicianRequest {
  intervention_id: number;
  technician_id: number;
}

export interface AvailableTechnician {
  id: number;
  email: string;
  role: string;
  created_at: string;
  // Disponibilité
  is_available: boolean;
  conflicts_count: number;
}

export interface InterventionConflict {
  intervention_id: number;
  technician_id: number;
  intervention_date: string;
  conflict_type: 'same_date' | 'overlapping';
  conflicting_interventions: {
    id: number;
    intervention_type: InterventionType;
    intervention_date: string;
    duration_hours: number | null;
  }[];
}

export interface PlanningDashboardStats {
  total_interventions: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  unassigned: number; // technician_id = NULL
  upcoming_7_days: number;
  by_type: {
    [key in InterventionType]: number;
  };
}

export interface CalendarEvent {
  id: number;
  title: string; // project_name + intervention_type
  start: string; // ISO datetime
  end: string;   // start + duration_hours
  type: InterventionType;
  status: InterventionStatus;
  technician_name?: string;
  project_name: string;
  notes?: string;
}

// Filtres pour recherche interventions
export interface InterventionFilters {
  project_id?: number;
  technician_id?: number;
  intervention_type?: InterventionType;
  status?: InterventionStatus;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  unassigned_only?: boolean;
}

// Réponses API standardisées
export interface InterventionListResponse {
  success: boolean;
  interventions: InterventionWithDetails[];
  total: number;
  filters_applied: InterventionFilters;
}

export interface InterventionDetailResponse {
  success: boolean;
  intervention: InterventionWithDetails;
}

export interface CreateInterventionResponse {
  success: boolean;
  intervention: Intervention;
  message: string;
}

export interface AssignTechnicianResponse {
  success: boolean;
  intervention: InterventionWithDetails;
  message: string;
  conflicts?: InterventionConflict;
}

export interface DashboardResponse {
  success: boolean;
  stats: PlanningDashboardStats;
}

export interface CalendarResponse {
  success: boolean;
  events: CalendarEvent[];
  month: string; // YYYY-MM
}

export interface ConflictsResponse {
  success: boolean;
  conflicts: InterventionConflict[];
}

export interface AvailableTechniciansResponse {
  success: boolean;
  technicians: AvailableTechnician[];
  date: string; // Date recherchée
}
