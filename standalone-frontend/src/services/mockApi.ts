// Mock API service for standalone frontend operation
import type { ApiResponse, User, Organization, Trainer, ApiKey, Session } from './api';

// Mock data storage
class MockStorage {
  private data: Record<string, any> = {};

  setItem(key: string, value: any): void {
    this.data[key] = value;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  getItem(key: string): any {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return this.data[key] || null;
  }

  removeItem(key: string): void {
    delete this.data[key];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}

const mockStorage = new MockStorage();

// Mock data generators
const generateMockUser = (): User => ({
  id: 'user_1',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  avatar: '/src/assets/logo.png',
  status: 'active',
  emailVerified: true,
  preferences: {
    theme: 'system',
    notifications: true,
    language: 'en'
  },
  profile: {}
});

const generateMockOrganization = (): Organization => ({
  id: 'org_1',
  name: 'Demo Organization',
  logo: '/src/assets/logo.png',
  domain: 'demo.com',
  subscription: {
    plan: 'premium',
    status: 'active'
  }
});

const generateMockTrainer = (id: string, name: string, type: string = 'custom'): Trainer => ({
  id,
  name,
  description: `This is a demo ${type} trainer`,
  type: type as any,
  status: 'draft',
  organizationId: 'org_1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    totalInteractions: Math.floor(Math.random() * 100),
    completionRate: Math.floor(Math.random() * 100),
    avgSessionTime: Math.floor(Math.random() * 30) + 5,
    totalSessions: Math.floor(Math.random() * 50),
    estimatedDuration: Math.floor(Math.random() * 20) + 10
  }
});

const generateMockApiKey = (id: string, name: string, type: string = 'openai'): ApiKey => ({
  id,
  name,
  type: type as any,
  key: `sk-${Math.random().toString(36).substring(2, 15)}`,
  isActive: true,
  isVisible: true,
  lastUsed: new Date().toISOString(),
  usageCount: Math.floor(Math.random() * 1000),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const generateMockSession = (id: string, trainerId: string): Session => ({
  id,
  trainerId,
  userId: 'user_1',
  status: 'active',
  startTime: new Date().toISOString(),
  endTime: undefined,
  duration: undefined,
  messages: [
    {
      id: 'msg_1',
      role: 'user',
      content: 'Hello, I would like to start training',
      timestamp: new Date().toISOString()
    },
    {
      id: 'msg_2',
      role: 'assistant',
      content: 'Welcome! I\'m here to help you with your training. What would you like to learn today?',
      timestamp: new Date().toISOString()
    }
  ]
});

// Initialize mock data
const initializeMockData = () => {
  const existingData = mockStorage.getItem('mockData');
  if (!existingData) {
    const mockData = {
      users: [generateMockUser()],
      organizations: [generateMockOrganization()],
      trainers: [
        generateMockTrainer('trainer_1', 'Customer Service Training', 'customer-service'),
        generateMockTrainer('trainer_2', 'Sales Training', 'sales'),
        generateMockTrainer('trainer_3', 'Compliance Training', 'compliance')
      ],
      apiKeys: [
        generateMockApiKey('key_1', 'OpenAI Production', 'openai'),
        generateMockApiKey('key_2', 'Anthropic Backup', 'anthropic')
      ],
      sessions: [
        generateMockSession('session_1', 'trainer_1'),
        generateMockSession('session_2', 'trainer_2')
      ]
    };
    mockStorage.setItem('mockData', mockData);
  }
};

// Initialize data on import
initializeMockData();

// Mock API service class
class MockApiService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken(): void {
    this.token = mockStorage.getItem('authToken');
  }

  public setToken(token: string): void {
    this.token = token;
    mockStorage.setItem('authToken', token);
  }

  public clearToken(): void {
    this.token = null;
    mockStorage.removeItem('authToken');
  }

  public getToken(): string | null {
    return this.token;
  }

  private getMockData() {
    return mockStorage.getItem('mockData') || {
      users: [],
      organizations: [],
      trainers: [],
      apiKeys: [],
      sessions: []
    };
  }

  private updateMockData(updater: (data: any) => void) {
    const data = this.getMockData();
    updater(data);
    mockStorage.setItem('mockData', data);
  }

  private delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Auth methods
  public async login(email: string, password: string): Promise<ApiResponse<any>> {
    await this.delay();
    
    const data = this.getMockData();
    const user = data.users[0];
    
    if (email === 'demo@example.com' && password === 'demo123') {
      const token = 'mock-token-' + Date.now();
      this.setToken(token);
      
      return {
        success: true,
        data: {
          user,
          organizations: data.organizations,
          token
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials'
    };
  }

  public async register(userData: any): Promise<ApiResponse<any>> {
    await this.delay();
    
    const data = this.getMockData();
    const newUser = {
      id: 'user_' + Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      status: 'active',
      emailVerified: true,
      preferences: {},
      profile: {}
    };
    
    data.users.push(newUser);
    this.updateMockData(() => data);
    
    const token = 'mock-token-' + Date.now();
    this.setToken(token);
    
    return {
      success: true,
      data: {
        user: newUser,
        organizations: data.organizations,
        token
      }
    };
  }

  public async getCurrentUser(): Promise<ApiResponse<any>> {
    await this.delay();
    
    if (!this.token) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }
    
    const data = this.getMockData();
    return {
      success: true,
      data: {
        user: data.users[0],
        organizations: data.organizations
      }
    };
  }

  // Trainer methods
  public async getTrainers(organizationId?: string): Promise<ApiResponse<Trainer[]>> {
    await this.delay();
    const data = this.getMockData();
    return {
      success: true,
      data: data.trainers
    };
  }

  public async getTrainer(id: string): Promise<ApiResponse<Trainer>> {
    await this.delay();
    const data = this.getMockData();
    const trainer = data.trainers.find((t: Trainer) => t.id === id);
    
    if (!trainer) {
      return {
        success: false,
        message: 'Trainer not found'
      };
    }
    
    return {
      success: true,
      data: trainer
    };
  }

  public async createTrainer(trainerData: any): Promise<ApiResponse<Trainer>> {
    await this.delay();
    
    const newTrainer = generateMockTrainer(
      'trainer_' + Date.now(),
      trainerData.name,
      trainerData.type
    );
    
    this.updateMockData((data) => {
      data.trainers.push(newTrainer);
    });
    
    return {
      success: true,
      data: newTrainer
    };
  }

  public async updateTrainer(id: string, updates: Partial<Trainer>): Promise<ApiResponse<Trainer>> {
    await this.delay();
    
    this.updateMockData((data) => {
      const trainerIndex = data.trainers.findIndex((t: Trainer) => t.id === id);
      if (trainerIndex !== -1) {
        data.trainers[trainerIndex] = {
          ...data.trainers[trainerIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
    });
    
    const data = this.getMockData();
    const trainer = data.trainers.find((t: Trainer) => t.id === id);
    
    return {
      success: true,
      data: trainer
    };
  }

  public async deleteTrainer(id: string): Promise<ApiResponse> {
    await this.delay();
    
    this.updateMockData((data) => {
      data.trainers = data.trainers.filter((t: Trainer) => t.id !== id);
    });
    
    return {
      success: true,
      message: 'Trainer deleted successfully'
    };
  }

  // API Key methods
  public async getApiKeys(organizationId: string): Promise<ApiResponse<ApiKey[]>> {
    await this.delay();
    const data = this.getMockData();
    return {
      success: true,
      data: data.apiKeys
    };
  }

  public async createApiKey(apiKeyData: any): Promise<ApiResponse<ApiKey>> {
    await this.delay();
    
    const newApiKey = generateMockApiKey(
      'key_' + Date.now(),
      apiKeyData.name,
      apiKeyData.type
    );
    
    this.updateMockData((data) => {
      data.apiKeys.push(newApiKey);
    });
    
    return {
      success: true,
      data: newApiKey
    };
  }

  public async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiResponse<ApiKey>> {
    await this.delay();
    
    this.updateMockData((data) => {
      const keyIndex = data.apiKeys.findIndex((k: ApiKey) => k.id === id);
      if (keyIndex !== -1) {
        data.apiKeys[keyIndex] = {
          ...data.apiKeys[keyIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
    });
    
    const data = this.getMockData();
    const apiKey = data.apiKeys.find((k: ApiKey) => k.id === id);
    
    return {
      success: true,
      data: apiKey
    };
  }

  public async deleteApiKey(id: string): Promise<ApiResponse> {
    await this.delay();
    
    this.updateMockData((data) => {
      data.apiKeys = data.apiKeys.filter((k: ApiKey) => k.id !== id);
    });
    
    return {
      success: true,
      message: 'API key deleted successfully'
    };
  }

  // Session methods
  public async getSessions(organizationId?: string): Promise<ApiResponse<Session[]>> {
    await this.delay();
    const data = this.getMockData();
    return {
      success: true,
      data: data.sessions
    };
  }

  public async createSession(sessionData: any): Promise<ApiResponse<Session>> {
    await this.delay();
    
    const newSession = generateMockSession(
      'session_' + Date.now(),
      sessionData.trainerId
    );
    
    this.updateMockData((data) => {
      data.sessions.push(newSession);
    });
    
    return {
      success: true,
      data: newSession
    };
  }

  // Analytics methods
  public async getAnalytics(organizationId: string, filters?: any): Promise<ApiResponse<any>> {
    await this.delay();
    
    return {
      success: true,
      data: {
        charts: [
          {
            type: 'line',
            title: 'Training Sessions Over Time',
            data: [
              { date: '2024-01-01', sessions: 10 },
              { date: '2024-01-02', sessions: 15 },
              { date: '2024-01-03', sessions: 12 },
              { date: '2024-01-04', sessions: 18 },
              { date: '2024-01-05', sessions: 22 }
            ]
          },
          {
            type: 'bar',
            title: 'Completion Rates by Trainer',
            data: [
              { trainer: 'Customer Service', rate: 85 },
              { trainer: 'Sales Training', rate: 92 },
              { trainer: 'Compliance', rate: 78 }
            ]
          }
        ],
        stats: {
          totalSessions: 150,
          totalUsers: 25,
          avgCompletionRate: 85,
          totalTrainers: 3
        }
      }
    };
  }

  // Health check
  public async healthCheck(): Promise<ApiResponse> {
    await this.delay(100);
    return {
      success: true,
      data: { status: 'ok', mode: 'mock' }
    };
  }

  // File upload simulation
  public async uploadContentFiles(files: File[], extraFields?: Record<string, string>): Promise<ApiResponse<any>> {
    await this.delay(1000);
    
    const uploadedFiles = files.map(file => ({
      filename: `mock_${Date.now()}_${file.name}`,
      path: `/uploads/training-materials/mock_${Date.now()}_${file.name}`,
      mimetype: file.type,
      size: file.size,
      originalName: file.name,
      publicUrl: URL.createObjectURL(file)
    }));
    
    return {
      success: true,
      data: { files: uploadedFiles }
    };
  }

  // Profile methods
  public async getMyProfile(): Promise<ApiResponse<User>> {
    await this.delay();
    const data = this.getMockData();
    return {
      success: true,
      data: data.users[0]
    };
  }

  public async updateMyProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    await this.delay();
    
    this.updateMockData((data) => {
      data.users[0] = { ...data.users[0], ...updates };
    });
    
    const data = this.getMockData();
    return {
      success: true,
      data: data.users[0]
    };
  }

  public async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
    await this.delay(1000);
    
    const avatarUrl = URL.createObjectURL(file);
    
    this.updateMockData((data) => {
      data.users[0].avatar = avatarUrl;
    });
    
    return {
      success: true,
      data: { avatar: avatarUrl }
    };
  }

  // Other methods that might be called
  public async verifyEmail(token: string): Promise<ApiResponse> {
    await this.delay();
    return { success: true, message: 'Email verified successfully' };
  }

  public async resendVerification(email: string): Promise<ApiResponse> {
    await this.delay();
    return { success: true, message: 'Verification email sent' };
  }

  public async forgotPassword(email: string): Promise<ApiResponse> {
    await this.delay();
    return { success: true, message: 'Password reset email sent' };
  }

  public async resetPassword(token: string, password: string): Promise<ApiResponse> {
    await this.delay();
    return { success: true, message: 'Password reset successfully' };
  }

  public async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    await this.delay();
    const data = this.getMockData();
    return {
      success: true,
      data: data.organizations
    };
  }

  public async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    await this.delay();
    const data = this.getMockData();
    const org = data.organizations.find((o: Organization) => o.id === id);
    
    if (!org) {
      return {
        success: false,
        message: 'Organization not found'
      };
    }
    
    return {
      success: true,
      data: org
    };
  }

  public async deployTrainer(id: string): Promise<ApiResponse> {
    await this.delay();
    return { success: true, message: 'Trainer deployed successfully' };
  }

  public async undeployTrainer(id: string): Promise<ApiResponse> {
    await this.delay();
    return { success: true, message: 'Trainer undeployed successfully' };
  }

  public async getSession(id: string): Promise<ApiResponse<Session>> {
    await this.delay();
    const data = this.getMockData();
    const session = data.sessions.find((s: Session) => s.id === id);
    
    if (!session) {
      return {
        success: false,
        message: 'Session not found'
      };
    }
    
    return {
      success: true,
      data: session
    };
  }

  public async updateSession(id: string, updates: Partial<Session>): Promise<ApiResponse<Session>> {
    await this.delay();
    
    this.updateMockData((data) => {
      const sessionIndex = data.sessions.findIndex((s: Session) => s.id === id);
      if (sessionIndex !== -1) {
        data.sessions[sessionIndex] = {
          ...data.sessions[sessionIndex],
          ...updates
        };
      }
    });
    
    const data = this.getMockData();
    const session = data.sessions.find((s: Session) => s.id === id);
    
    return {
      success: true,
      data: session
    };
  }

  public async sendSessionMessage(sessionId: string, message: string): Promise<ApiResponse<any>> {
    await this.delay(1000);
    
    const aiResponse = {
      id: 'msg_' + Date.now(),
      role: 'assistant',
      content: `This is a mock AI response to: "${message}". In a real implementation, this would be generated by an AI model.`,
      timestamp: new Date().toISOString()
    };
    
    this.updateMockData((data) => {
      const session = data.sessions.find((s: Session) => s.id === sessionId);
      if (session) {
        session.messages.push({
          id: 'msg_' + Date.now(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });
        session.messages.push(aiResponse);
      }
    });
    
    return {
      success: true,
      data: {
        aiMessage: aiResponse,
        status: 'completed'
      }
    };
  }

  public async getTeamMembers(organizationId: string): Promise<ApiResponse<any[]>> {
    await this.delay();
    return {
      success: true,
      data: [
        {
          id: 'member_1',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'admin',
          status: 'active'
        }
      ]
    };
  }

  public async inviteTeamMember(organizationId: string, inviteData: any): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      success: true,
      message: 'Team member invited successfully'
    };
  }

  public async acceptTeamInvite(organizationId: string, acceptData: any): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      success: true,
      message: 'Team invite accepted successfully'
    };
  }

  public async changeMyPassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    await this.delay();
    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  public async updatePreferences(preferences: any): Promise<ApiResponse<any>> {
    await this.delay();
    
    this.updateMockData((data) => {
      data.users[0].preferences = { ...data.users[0].preferences, ...preferences };
    });
    
    return {
      success: true,
      data: { preferences: this.getMockData().users[0].preferences }
    };
  }

  // Trainer Flow methods
  public async getLatestTrainerFlow(trainerId: string, status?: string): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      success: true,
      data: {
        id: 'flow_1',
        trainerId,
        name: 'Default Flow',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 100 },
            data: { label: 'Start Training' }
          },
          {
            id: 'question',
            type: 'question',
            position: { x: 300, y: 100 },
            data: { label: 'Ask Question', question: 'What would you like to learn?' }
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'start',
            target: 'question'
          }
        ],
        settings: {},
        status: status || 'draft'
      }
    };
  }

  public async createTrainerFlow(trainerId: string, flow: any): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      success: true,
      data: {
        id: 'flow_' + Date.now(),
        trainerId,
        ...flow,
        createdAt: new Date().toISOString()
      }
    };
  }

  public async updateTrainerFlow(flowId: string, updates: any): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      success: true,
      data: {
        id: flowId,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    };
  }

  public async validateTrainerFlow(payload: any): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      success: true,
      data: {
        valid: true,
        errors: []
      }
    };
  }

  public async publishTrainerFlow(flowId: string): Promise<ApiResponse<any>> {
    await this.delay();
    return {
      success: true,
      message: 'Trainer flow published successfully'
    };
  }

  // Debug method
  public async debugApiConnection(): Promise<{ connected: boolean; error?: string; baseUrl: string }> {
    return {
      connected: true,
      baseUrl: 'mock://api'
    };
  }
}

export const mockApiService = new MockApiService();
export default MockApiService;
