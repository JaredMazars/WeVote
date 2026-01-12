export type User = {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'employee' | 'user' | 'auditor';
  email_verified: number;
  needs_password_change?: number;
  is_temp_password?: number;
};

export type Employee = {
  id: number;
  name: string;
  email: string;
  position?: string;
  department_id?: number;
  bio?: string;
  hire_date?: string;
  salary?: number;
  manager_id?: number;
};

export type Candidate = {
  id: number;
  name: string;
  position: string;
  department: string;
  bio: string;
  image?: string;
  votes?: number;
};

export type Resolution = {
  id: number;
  title: string;
  description: string;
  category: string;
  proposed_date: string;
  voting_end_date: string;
  yes_votes?: number;
  no_votes?: number;
  abstain_votes?: number;
};

export type Vote = {
  id: number;
  user_id: string;
  candidate_id?: number;
  resolution_id?: number;
  vote_type: 'yes' | 'no' | 'abstain' | 'candidate';
  is_proxy: boolean;
  proxy_for?: string;
  voted_at: string;
};

export type ProxyAppointment = {
  id: number;
  appointer_id: string;
  proxy_id: string;
  type: 'instructional' | 'discretionary';
  instructions?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
};

export type Department = {
  id: number;
  name: string;
};

export type Skill = {
  skill_name: string;
  proficiency_level: string;
  years_experience: number;
  certified: boolean;
};

export type Achievement = {
  title: string;
  description: string;
  achievement_date: string;
  category: string;
  points: number;
};
