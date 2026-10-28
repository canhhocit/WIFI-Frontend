import { request } from './client';
import {
  PortalInitResponse,
  GuestLoginRequest,
  GuestLoginResponse,
  GuestSessionStatusResponse,
  OtpRequestDto,
  OtpVerifyRequestDto,
  OtpResultDto,
  SurveyDto,
  SurveyResponseSubmitRequest,
  SurveyResponseDto
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

  // OTP Verification & Device Remember
  sendOtp: (data: OtpRequestDto) => {
    return request<OtpResultDto>('/v1/portal/verification/otp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyOtp: (data: OtpVerifyRequestDto) => {
    return request<OtpResultDto>('/v1/portal/verification/otp/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  checkMac: (mac: string) => {
    return request<boolean>(`/v1/portal/verification/check-mac?mac=${encodeURIComponent(mac)}`);
  },

  // Surveys on Portal
  getSurvey: (surveyId: number) => {
    return request<SurveyDto>(`/v1/portal/surveys/${surveyId}`);
  },

  submitSurvey: (surveyId: number, data: SurveyResponseSubmitRequest) => {
    return request<SurveyResponseDto>(`/v1/portal/surveys/${surveyId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
