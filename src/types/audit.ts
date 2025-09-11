export interface AuditLog {
  id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_values?: any;
  new_values?: any;
  description: string;
  user_id?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  operation: string; 
  changed_by: string
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