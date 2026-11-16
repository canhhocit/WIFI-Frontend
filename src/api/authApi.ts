import { request } from './client';
import { LoginResponse, AdminUserDto, ChangePasswordRequest } from '../types/models';

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const data = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    }
    return data;
  },

  getMe: (): Promise<AdminUserDto> => {
    return request<AdminUserDto>('/auth/me');
  },

  changePassword: (data: ChangePasswordRequest): Promise<void> => {
    return request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('wifi_rbac_permissions');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('admin_token');
  },

  getCurrentUser: (): AdminUserDto | null => {
    const userStr = localStorage.getItem('admin_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};
