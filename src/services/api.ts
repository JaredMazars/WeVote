const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  // Auth endpoints (still available, but not required)
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

  // Resolution endpoints
  async getresolutions() {
    const response = await fetch(`http://localhost:3001/api/resolutions`, {
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

  async voteForResolution(id: string, comment?: string) {
    const response = await fetch(`${this.baseURL}/resolutions/${id}/vote`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ comment }),
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

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`, {
      method: 'GET',
    });

    return await this.handleResponse(response);
  }
}

export default new ApiService();
