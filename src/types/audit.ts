export interface AuditLog {
  id: string;
  user_id?: string;
  action_type: string;
  action_category: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure' | 'warning';
  created_at: string;
  
  // Legacy fields for backward compatibility
  table_name?: string;
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id?: string;
  old_values?: any;
  new_values?: any;
  user_name?: string;
  operation?: string;
  changed_by?: string;
}

export interface ProxyGroup {
  id: string;
  proxy_id: number;
  proxy_name: string;
  vote_type: 'employee' | 'resolution';
  employee_id?: number;
  resolution_id?: number;
  reason: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  members: ProxyGroupMember[];
}

export interface ProxyGroupMember {
  id: string;
  proxy_group_id: string;
  delegator_id: number;
  delegator_name: string;
  delegator_email: string;
  created_at?: string;
}

export interface ProxyVote {
  id: string;
  proxy_name: string;
  delegator_name: string;
  vote_type: 'employee' | 'resolution';
  target_name: string;
  reason: string;
  created_at: string;
}