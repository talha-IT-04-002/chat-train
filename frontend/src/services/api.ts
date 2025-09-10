const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('API Configuration:', {
  baseURL: API_BASE_URL,
  env: import.meta.env.MODE,
  viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL
});

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: any[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  preferences?: { theme?: 'light' | 'dark' | 'system'; notifications?: boolean; language?: string };
  profile?: any;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  domain?: string;
  role: string;
  permissions: string[];
  subscription?: any;
}

export interface LoginResponse {
  user: User;
  organizations: Organization[];
  token: string;
}

export interface Trainer {
  id: string;
  name: string;
  description?: string;
  type: 'compliance' | 'sales' | 'customer-service' | 'onboarding' | 'soft-skills' | 'knowledge-qa' | 'custom';
  status: 'draft' | 'active' | 'inactive' | 'archived' | 'testing';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    totalInteractions: number;
    completionRate: number;
    avgSessionTime: number;
    totalSessions: number;
    lastDeployed?: string;
    estimatedDuration: number;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  key: string;
  isActive: boolean;
  isVisible: boolean;
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  trainerId: string;
  userId: string;
  status: 'active' | 'completed' | 'abandoned';
  startTime: string;
  endTime?: string;
  duration?: number;
  messages: any[];
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  // Public helpers for consumers
  public getBaseUrl(): string {
    return this.baseURL;
  }

  public getApiRoot(): string {
    return this.baseURL.replace(/\/?api$/i, '');
  }

  public buildPublicUrl(pathOrUrl: string | undefined | null): string {
    if (!pathOrUrl) return '';
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const root = this.getApiRoot().replace(/\/$/, '');
    const path = String(pathOrUrl).startsWith('/') ? String(pathOrUrl) : `/${String(pathOrUrl)}`;
    return `${root}${path}`;
  }

  private loadToken(): void {
    this.token = localStorage.getItem('authToken');
  }

  // ===== User Profile =====
  public async getMyProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/me/profile');
  }

  public async updateMyProfile(updates: Partial<User> & { profile?: any }): Promise<ApiResponse<User>> {
    return this.request<User>('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async changeMyPassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  public async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
    const url = `${this.baseURL}/users/me/avatar`;
    const form = new FormData();
    form.append('avatar', file);
    const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    // Basic retry for transient tunnel/network errors
    let lastError: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, { method: 'POST', headers, body: form });
        const data = await response.json();
        if (!response.ok) {
          // Retry on typical transient statuses
          if ([502, 503, 504].includes(response.status) && attempt < 1) {
            await new Promise(r => setTimeout(r, 600));
            continue;
          }
          throw new Error(data?.message || `Avatar upload failed (${response.status})`);
        }
        return data;
      } catch (err) {
        lastError = err;
        if (attempt < 1) {
          await new Promise(r => setTimeout(r, 600));
          continue;
        }
      }
    }
    throw lastError || new Error('Avatar upload failed');
  }

  public async updatePreferences(preferences: Partial<{ theme: 'light' | 'dark' | 'system'; notifications: boolean; language: string; }>): Promise<ApiResponse<{ preferences: any }>> {
    return this.request<{ preferences: any }>('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${text.substring(0, 200)}`);
        }
        
        return {
          success: true,
          message: 'Request completed',
          data: text as any
        };
      }

      if (!response.ok) {
        if (response.status === 401) {
          if (this.token) {
            this.clearToken();
            window.location.href = '/login';
          }
          throw new Error(data.message || 'Authentication failed');
        }

        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  public async uploadContentFiles(files: File[], extraFields?: Record<string, string>): Promise<ApiResponse<{ files: Array<{ filename: string; path: string; mimetype: string; size: number; originalName: string; publicUrl: string }> }>> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    }

    const endpoint = '/content/upload';
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};
    headers['ngrok-skip-browser-warning'] = 'true';
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received from upload:', text);
        
        if (!response.ok) {
          throw new Error(`Upload failed! status: ${response.status} - ${text.substring(0, 200)}`);
        }
        
        throw new Error('Upload completed but server returned non-JSON response');
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Upload failed');
      }

      const apiRoot = this.baseURL.replace(/\/?api$/i, '');
      const mapped = (data?.data?.files || []).map((f: any) => ({
        ...f,
        publicUrl: `${apiRoot}/uploads/training-materials/${f.filename}`,
      }));

      return {
        success: true,
        message: data?.message,
        data: { files: mapped },
      };
    } catch (error) {
      console.error('Upload request failed:', error);
      throw error;
    }
  }

  public async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public async getCurrentUser(): Promise<ApiResponse<{ user: User; organizations: Organization[] }>> {
    return this.request<{ user: User; organizations: Organization[] }>('/auth/me');
  }

  public async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  public async resendVerification(email: string): Promise<ApiResponse> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  public async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    return this.request<Organization[]>('/organizations');
  }

  public async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    return this.request<Organization>(`/organizations/${id}`);
  }

  public async getTrainers(organizationId?: string): Promise<ApiResponse<Trainer[]>> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request<Trainer[]>(`/trainers${params}`);
  }

  public async getTrainer(id: string): Promise<ApiResponse<Trainer>> {
    return this.request<Trainer>(`/trainers/${id}`);
  }

  public async createTrainer(trainerData: {
    name: string;
    description?: string;
    organizationId: string;
    type: 'compliance' | 'sales' | 'customer-service' | 'onboarding' | 'soft-skills' | 'knowledge-qa' | 'custom';
    learningObjectives?: string;
    configuration?: any;
  }): Promise<ApiResponse<Trainer>> {
    return this.request<Trainer>('/trainers', {
      method: 'POST',
      body: JSON.stringify(trainerData),
    });
  }

  public async updateTrainer(id: string, trainerData: Partial<Trainer>): Promise<ApiResponse<Trainer>> {
    return this.request<Trainer>(`/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trainerData),
    });
  }

  public async deleteTrainer(id: string): Promise<ApiResponse> {
    return this.request(`/trainers/${id}`, {
      method: 'DELETE',
    });
  }

  public async deployTrainer(id: string): Promise<ApiResponse> {
    return this.request(`/trainers/${id}/deploy`, {
      method: 'POST',
    });
  }

  public async undeployTrainer(id: string): Promise<ApiResponse> {
    return this.request(`/trainers/${id}/undeploy`, {
      method: 'POST',
    });
  }

  public async getApiKeys(organizationId: string): Promise<ApiResponse<ApiKey[]>> {
    return this.request<ApiKey[]>(`/api-keys?organizationId=${organizationId}`);
  }

  public async createApiKey(apiKeyData: {
    name: string;
    key: string;
    type: 'openai' | 'anthropic' | 'google' | 'custom';
    organizationId: string;
    permissions?: string[];
  }): Promise<ApiResponse<ApiKey>> {
    return this.request<ApiKey>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(apiKeyData),
    });
  }

  public async updateApiKey(id: string, apiKeyData: Partial<ApiKey>): Promise<ApiResponse<ApiKey>> {
    return this.request<ApiKey>(`/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiKeyData),
    });
  }

  public async deleteApiKey(id: string): Promise<ApiResponse> {
    return this.request(`/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  public async getSessions(organizationId?: string): Promise<ApiResponse<Session[]>> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request<Session[]>(`/sessions${params}`);
  }

  public async getSession(id: string): Promise<ApiResponse<Session>> {
    return this.request<Session>(`/sessions/${id}`);
  }

  public async createSession(sessionData: {
    trainerId: string;
    organizationId: string;
  }): Promise<ApiResponse<Session>> {
    return this.request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  public async updateSession(id: string, sessionData: Partial<Session>): Promise<ApiResponse<Session>> {
    return this.request<Session>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  public async sendSessionMessage(sessionId: string, message: string): Promise<ApiResponse<{ aiMessage: any; status: string }>> {
    return this.request<{ aiMessage: any; status: string }>(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  public async getAnalytics(organizationId: string, filters?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ organizationId, ...filters });
    return this.request<any>(`/analytics?${params}`);
  }

  public async getTeamMembers(organizationId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/organizations/${organizationId}/team`);
  }

  public async inviteTeamMember(organizationId: string, inviteData: {
    email: string;
    role: 'owner' | 'admin' | 'manager' | 'trainer' | 'viewer';
  }): Promise<ApiResponse<any>> {
    return this.request<any>(`/organizations/${organizationId}/team/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  }

  public async acceptTeamInvite(organizationId: string, acceptData: {
    token: string;
    firstName?: string;
    lastName?: string;
    password?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>(`/organizations/${organizationId}/team/accept`, {
      method: 'POST',
      body: JSON.stringify(acceptData),
    });
  }

  public async updateTeamMemberRole(organizationId: string, memberId: string, role: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/organizations/${organizationId}/team/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  public async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Debug method to check API connectivity
  public async debugApiConnection(): Promise<{ connected: boolean; error?: string; baseUrl: string }> {
    try {
      console.log('Testing API connection to:', this.baseURL);
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      const contentType = response.headers.get('content-type');
      console.log('Response status:', response.status);
      console.log('Response content-type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response data:', data);
        return { connected: response.ok, baseUrl: this.baseURL };
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text.substring(0, 500));
        return { 
          connected: false, 
          error: `Server returned non-JSON response: ${text.substring(0, 200)}`, 
          baseUrl: this.baseURL 
        };
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        baseUrl: this.baseURL 
      };
    }
  }

  public async getLatestTrainerFlow(trainerId: string, status?: 'draft' | 'published') {
    const q = status ? `?status=${status}` : '';
    return this.request(`/trainer-flows/${trainerId}/latest${q}`);
  }

  public async createTrainerFlow(trainerId: string, flow: { name: string; nodes: any[]; edges: any[]; settings?: any; }) {
    return this.request(`/trainer-flows/${trainerId}`, {
      method: 'POST',
      body: JSON.stringify(flow)
    });
  }

  public async updateTrainerFlow(flowId: string, updates: Partial<{ name: string; nodes: any[]; edges: any[]; settings: any; }>) {
    return this.request(`/trainer-flows/${flowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async validateTrainerFlow(payload: { nodes: any[]; edges: any[]; settings?: any; }) {
    return this.request(`/trainer-flows/validate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async publishTrainerFlow(flowId: string) {
    return this.request(`/trainer-flows/${flowId}/publish`, {
      method: 'POST'
    });
  }
}

export const apiService = new ApiService();

declare global {
  interface Window {
    debugApi: () => Promise<{ connected: boolean; error?: string; baseUrl: string }>;
  }
}

window.debugApi = async () => {
  console.log('=== API Debug Information ===');
  console.log('Base URL:', apiService['baseURL']);
  console.log('Token:', apiService.getToken() ? 'Present' : 'Not present');
  
  try {
    const result = await apiService.debugApiConnection();
    console.log('Connection test result:', result);
    return result;
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      baseUrl: apiService['baseURL']
    };
  }
};

export default ApiService;