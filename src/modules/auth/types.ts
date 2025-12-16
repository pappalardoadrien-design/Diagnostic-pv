/**
 * Module Auth - Types TypeScript
 * Phase 6: Multi-utilisateurs & Permissions
 */

// ============================================================
// Cloudflare Bindings
// ============================================================
export type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
};

// ============================================================
// User Types
// ============================================================
export type UserRole = 'admin' | 'subcontractor' | 'client' | 'auditor';

export interface User {
  id: number;
  email: string;
  full_name: string;
  company: string | null;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  company?: string;
  role: UserRole;
  must_change_password?: boolean;
}

// ============================================================
// Session Types
// ============================================================
export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SessionWithUser extends Session {
  user: User;
}

// ============================================================
// Audit Assignment Types
// ============================================================
export type AssignmentStatus = 'active' | 'revoked' | 'expired';

export interface AuditAssignment {
  id: number;
  audit_token: string;
  user_id: number;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  allowed_modules: string[] | null; // ['el', 'iv', 'visual'] or null = all
  assigned_by: number;
  assigned_at: string;
  status: AssignmentStatus;
  expires_at: string | null;
  notes: string | null;
}

export interface AuditAssignmentWithUser extends AuditAssignment {
  user: User;
  assigned_by_user: User;
}

// ============================================================
// Activity Log Types
// ============================================================
export type ActivityAction = 
  | 'login' 
  | 'logout' 
  | 'view_audit' 
  | 'edit_defect' 
  | 'generate_report'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'assign_audit'
  | 'revoke_assignment'
  | 'system_init';

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: ActivityAction;
  resource_type: string | null;
  resource_id: string | null;
  details: string | null; // JSON
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ActivityLogWithUser extends ActivityLog {
  user: User | null;
}

// ============================================================
// Auth Request/Response Types
// ============================================================
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  session_token?: string;
  user?: User;
  must_change_password?: boolean;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface PermissionCheck {
  has_access: boolean;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  allowed_modules: string[] | null;
  reason?: string;
}
