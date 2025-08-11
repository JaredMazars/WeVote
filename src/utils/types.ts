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
  achievements: string[];
  yearsOfService: number;
  skills: string[];
  votes: number;
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