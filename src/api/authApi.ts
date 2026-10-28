import { request } from './client';
import { LoginResponse, AdminUserDto } from '../types/models';

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

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
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
