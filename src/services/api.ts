const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    return await this.handleResponse(response);
  }

  async register(userData: { email: string; password: string; name: string; avatar_url?: string }) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    return await this.handleResponse(response);
  }

  async registerM(userData: { email: string; password: string; name: string; avatar_url?: string }) {
    const response = await fetch(`${this.baseURL}/auth/registerM`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    return await this.handleResponse(response);
  }

  // Microsoft OAuth login
  async loginWithMicrosoft(accessToken: string, user: any) {
    const response = await fetch(`${this.baseURL}/auth/microsoft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        user
      }),
    });

    return await this.handleResponse(response);
  }

  async verifyToken() {
    const response = await fetch(`${this.baseURL}/auth/verify`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  // Employee endpoints
  async getEmployees() {
    const response = await fetch(`${this.baseURL}/employees`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  async getEmployee(id: string) {
    const response = await fetch(`${this.baseURL}/employees/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  async voteForEmployee(id: string, comment?: string) {
    const response = await fetch(`${this.baseURL}/employees/${id}/vote`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ comment }),
    });

    return await this.handleResponse(response);
  }

  async getEmployeeStats() {
    const response = await fetch(`${this.baseURL}/employees/stats/voting`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  async registerEmployee(employeeData: any) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/employees/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error registering employee:', error);
    throw error;
  }
}

// Add this to your apiService
async checkEmployeeStatus(userId: string) {
  try {
    const headers = this.getHeaders();
    console.log('Request headers:', headers); 
    const response = await fetch(`${API_BASE_URL}/employees/status/${userId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error checking employee status:', error);
    throw error;
  }
}


  // Resolution endpoints
  async getresolutions() {
    const response = await fetch(`${this.baseURL}/resolutions`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  async getResolution(id: string) {
    const response = await fetch(`${this.baseURL}/resolutions/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  // async voteForResolution(id: string, comment?: string, vote_choice?: string) {
  //   const response = await fetch(`${this.baseURL}/resolutions/${id}/vote`, {
  //     method: 'POST',
  //     headers: this.getHeaders(),
  //     body: JSON.stringify({ vote_choice, comment }),
  //   });

  //   return await this.handleResponse(response);
  // }

  async voteForResolution(id: string, vote_choice?: string) {
    const response = await fetch(`${this.baseURL}/resolutions/${id}/vote`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ vote_choice}),
    });

    return await this.handleResponse(response);
  }

  async getResolutionCategories() {
    const response = await fetch(`${this.baseURL}/resolutions/categories/all`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  async getresolutionstats() {
    const response = await fetch(`${this.baseURL}/resolutions/stats/voting`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  // Vote checking
  async checkVoteStatus(voterId: string, voteType: string, targetId: string) {
    const response = await fetch(`${this.baseURL}/votes/check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        voter_id: voterId,
        vote_type: voteType,
        employee_id: voteType === 'employee' ? targetId : null,
        resolution_id: voteType === 'resolution' ? targetId : null
      }),
    });

    return await this.handleResponse(response);
  }

  async getVoteStatusByUserId(userId: string) {
  const response = await fetch(`${this.baseURL}/admin/votes/user/${userId}`, {
    method: 'GET',
    headers: this.getHeaders(),
  });
  return await this.handleResponse(response);
}

async getVoteStatusByResolutionId(resolutionId: string) {
    const response = await fetch(`${API_BASE_URL}/resolutions/${resolutionId}/votes`, {
    method: 'GET',
    headers: this.getHeaders(),
  });
  return await this.handleResponse(response);
}
  
  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`, {
      method: 'GET',
    });

    return await this.handleResponse(response);
  }

  async updatePassword(userId: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, password }),
    });
    return await this.handleResponse(response);
  }
}

export default new ApiService();
