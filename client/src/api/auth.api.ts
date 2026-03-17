import api from './axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: AuthUser;
  };
}

export interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post('/auth/register', data),

  refresh: () =>
    api.post<RefreshResponse>('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get<MeResponse>('/auth/me'),

  updateProfile: (data: { fullName?: string; email?: string; currentPassword?: string; newPassword?: string }) =>
    api.patch('/auth/profile', data),
};
