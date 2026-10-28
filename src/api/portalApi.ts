import { request } from './client';
import {
  PortalInitResponse,
  GuestLoginRequest,
  GuestLoginResponse,
  GuestSessionStatusResponse
} from '../types/models';

export const portalApi = {
  init: (locationSlug?: string) => {
    const query = locationSlug ? `?location=${encodeURIComponent(locationSlug)}` : '';
    return request<PortalInitResponse>(`/portal/init${query}`);
  },

  login: (data: GuestLoginRequest) => {
    return request<GuestLoginResponse>('/portal/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSessionStatus: (sessionToken: string) => {
    return request<GuestSessionStatusResponse>(`/portal/session/${encodeURIComponent(sessionToken)}`);
  },

  disconnectSession: (sessionToken: string) => {
    return request<GuestSessionStatusResponse>(`/portal/session/${encodeURIComponent(sessionToken)}/disconnect`, {
      method: 'POST',
    });
  },
};
