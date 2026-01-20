// API Service for backend communication
const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      const data = await response.json();
      
      // Debug logging
      // console.log(`API Response from ${endpoint}:`, { 
      //   status: response.status, 
      //   ok: response.ok,
      //   dataKeys: Object.keys(data),
      //   data 
      // });
      
      // Transform backend response format to frontend format
      // Backend may return: {count, users} or {candidates} or {data} etc.
      // Frontend expects: {success, data}
      if (response.ok) {
        // If already in correct format
        if (data.success !== undefined) {
          return data;
        }
        
        // Transform various backend formats
        let transformedData = data;
        if (data.users) transformedData = data.users;
        else if (data.candidates) transformedData = data.candidates;
        else if (data.resolutions) transformedData = data.resolutions;
        else if (data.proxies) transformedData = data.proxies;
        else if (data.votes) transformedData = data.votes;
        else if (data.history) transformedData = data.history;
        else if (data.logs) transformedData = data.logs;
        else if (data.allocations) transformedData = data.allocations;
        else if (data.employees) transformedData = data.employees;
        else if (data.departments) transformedData = data.departments;
        else if (data.sessions) transformedData = data.sessions;
        
        console.log(`Transformed data for ${endpoint}:`, transformedData);
        
        return {
          success: true,
          data: transformedData,
          message: data.message || 'Success'
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Request failed',
        };
      }
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Backend returns: { message, token, user }
      if (response.ok && data.token && data.user) {
        // Store the token
        localStorage.setItem('token', data.token);
        
        // Transform backend user format to frontend format
        return {

          
          success: true,
          data: {
            id: data.user.userId.toString(),
            name: `${data.user.firstName} ${data.user.lastName}`,
            email: data.user.email,
            role: data.user.role,
            email_verified: data.user.isEmailVerified ? 1 : 0,
            needs_password_change: data.user.requiresPasswordChange ? 1 : 0,
            is_temp_password: data.user.requiresPasswordChange ? 1 : 0
          },
          message: data.message
        };
      }

      // Login failed
      return {
        success: false,
        message: data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login API error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(name: string, email: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
  }

  async loginWithMicrosoft() {
    // Implement Microsoft OAuth flow
    return { success: true, data: null };
  }

  async updatePassword(userId: string, newPassword: string) {
    return this.request(`/auth/update-password/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
  }

  // Employee endpoints
  async registerEmployee(employeeData: any) {
    return this.request('/employees/register', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async checkEmployeeStatus(userId: string) {
    return this.request(`/employees/status/${userId}`);
  }

  async getEmployees() {
    return this.request('/employees');
  }

  async getDepartments() {
    return this.request('/departments');
  }

  async getManagers() {
    return this.request('/employees/managers');
  }

  // Voting endpoints
  async getCandidates() {
    return this.request('/candidates');
  }

  async getResolutions() {
    return this.request('/resolutions');
  }

  async castVote(voteData: any) {
    return this.request('/votes/cast', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  async getVotingResults() {
    return this.request('/votes/results');
  }

  // Proxy endpoints
  async appointProxy(proxyData: any) {
    return this.request('/proxy/appoint', {
      method: 'POST',
      body: JSON.stringify(proxyData),
    });
  }

  async getProxyAppointments(userId: string) {
    return this.request(`/proxy/appointments/${userId}`);
  }

  async getProxiesForUser(userId: string) {
    return this.request(`/proxy/for-user/${userId}`);
  }

  // WhatsApp endpoints
  async sendWhatsAppVoting(employees: any[], to: string) {
    return this.request('/employees/send-whatsapp', {
      method: 'POST',
      body: JSON.stringify({ employees, to }),
    });
  }

  // ==================== ADMIN DASHBOARD API METHODS ====================
  
  // Users Management
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, userData: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: number) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(userId: number, isActive: boolean) {
    return this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Candidates Management  
  async createCandidate(candidateData: any) {
    return this.request('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidateData),
    });
  }

  async updateCandidate(candidateId: number, candidateData: any) {
    return this.request(`/candidates/${candidateId}`, {
      method: 'PUT',
      body: JSON.stringify(candidateData),
    });
  }

  async deleteCandidate(candidateId: number) {
    return this.request(`/candidates/${candidateId}`, {
      method: 'DELETE',
    });
  }

  async toggleCandidateStatus(candidateId: number, status: string) {
    return this.request(`/candidates/${candidateId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Resolutions Management
  async createResolution(resolutionData: any) {
    return this.request('/resolutions', {
      method: 'POST',
      body: JSON.stringify(resolutionData),
    });
  }

  async updateResolution(resolutionId: number, resolutionData: any) {
    return this.request(`/resolutions/${resolutionId}`, {
      method: 'PUT',
      body: JSON.stringify(resolutionData),
    });
  }

  async deleteResolution(resolutionId: number) {
    return this.request(`/resolutions/${resolutionId}`, {
      method: 'DELETE',
    });
  }

  async updateResolutionStatus(resolutionId: number, status: string) {
    return this.request(`/resolutions/${resolutionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Sessions Management
  async getSessions() {
    return this.request('/sessions');
  }

  async createSession(sessionData: any) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Vote Allocations
  async getVoteAllocations(sessionId?: number) {
    const endpoint = sessionId ? `/allocations?sessionId=${sessionId}` : '/allocations';
    return this.request(endpoint);
  }

  async allocateVotes(allocationData: any) {
    return this.request('/allocations', {
      method: 'POST',
      body: JSON.stringify(allocationData),
    });
  }

  async assignVotes(userId: number, votes: number, sessionId: number) {
    return this.request('/allocations', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        allocatedVotes: votes,
        sessionId,
        reason: 'Admin assignment',
        basedOn: 'ADMIN_ALLOCATION'
      }),
    });
  }

  // Vote Logs
  async getVoteLogs(filters?: { sessionId?: number; userId?: number }) {
    const params = new URLSearchParams();
    if (filters?.sessionId) params.append('sessionId', filters.sessionId.toString());
    const queryString = params.toString();
    return this.request(`/votes/history${queryString ? `?${queryString}` : ''}`);
  }

  async getCandidateVotes(sessionId?: number) {
    const endpoint = sessionId ? `/votes/results/candidates/${sessionId}` : '/votes/results/candidates/1';
    return this.request(endpoint);
  }

  async getResolutionVotes(sessionId?: number) {
    const endpoint = sessionId ? `/votes/results/resolutions/${sessionId}` : '/votes/results/resolutions/1';
    return this.request(endpoint);
  }

  // Audit Logs
  async getAuditLogs(filters?: { userId?: number; action?: string; startDate?: string; endDate?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId.toString());
    if (filters?.action) params.append('action', filters.action);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    return this.request(`/audit-logs${queryString ? `?${queryString}` : ''}`);
  }

  // Proxy Groups
  async getProxyGroups() {
    return this.request('/proxy/groups');
  }

  async getProxyAssignments(userId?: number) {
    const endpoint = userId ? `/proxy/assignments?userId=${userId}` : '/proxy/assignments';
    return this.request(endpoint);
  }

  async getProxyInstructions(proxyId: number) {
    return this.request(`/proxy/instructions/${proxyId}`);
  }

  // Attendance Tracking
  async getAttendance(sessionId: number) {
    return this.request(`/attendance/${sessionId}`);
  }

  async markAttendance(attendanceData: any) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  // Generic HTTP methods for flexibility
  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
