export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'voter';
  avatar?: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  bio: string;
  email?: string;
  phone_number?: string;
  achievements: Achievement[];
  yearsOfService: number;
  years_of_service?: number; // Keep for compatibility
  skills: Skill[];
  votes: number;
  total_votes?: number; // Keep for compatibility
  hire_date?: string;
  employee_id?: string;
  achievement_count?: number;
  skill_count?: number;
  avg_skill_level?: string;
  performance_rating?: string;
  created_at?: string;
  updated_at?: string;
  updatedAt?: string; // Keep for compatibility
}

export interface Achievement {
  title: string;
  description: string;
  achievement_date: string;
  category: string;
  points?: number;
}

export interface Skill {
  skill_name: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  years_experience?: number;
  certified?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  organizer: string;
  category: string;
  votes: number;
  details: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}