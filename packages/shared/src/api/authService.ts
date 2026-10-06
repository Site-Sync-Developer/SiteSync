import axiosInstance from './axiosInstance';
import { pushService } from './pushService';
import type { LoginRequest, LoginResponse, User } from '../models';
import {
  setStoredToken,
  setStoredUser,
  clearAuth,
  setStoredActiveProjectId,
  setRequiresSupervisorProjectPick,
} from '../utils/storage';

export interface RegisterInvitationPayload {
  token: string;
  first_name: string;
  last_name: string;
  password: string;
  email?: string;
  photo_url?: string;
  /** `strict` = use invitation role (staff manual register); `invite_link` = admin-app mapping (admin→admin, else supervisor). */
  role_mapping?: 'strict' | 'invite_link';
}

const extractErrorMessage = (error: unknown): string => {
  const axiosError = error as any;
  if (axiosError?.response?.data?.error) {
    return axiosError.response.data.error;
  }
  if (axiosError?.message) {
    return axiosError.message;
  }
  return 'An error occurred';
};

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { data } = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
      await setStoredToken(data.token);
      await setStoredUser(JSON.stringify(data.user));
      // Force fresh project selection after each login (used by supervisor dashboard scoping).
      await setStoredActiveProjectId(null);
      await setRequiresSupervisorProjectPick(data.user.role === 'supervisor');
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async register(payload: Partial<User> & { password: string }): Promise<LoginResponse> {
    try {
      const { data } = await axiosInstance.post<LoginResponse>('/auth/register', payload);
      await setStoredToken(data.token);
      await setStoredUser(JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async registerInvitation(payload: RegisterInvitationPayload): Promise<LoginResponse> {
    try {
      const { data } = await axiosInstance.post<LoginResponse>('/auth/register-invitation', payload);
      await setStoredToken(data.token);
      await setStoredUser(JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    try {
      const { data } = await axiosInstance.post<{ user: User }>('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      await setStoredUser(JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async logout(): Promise<void> {
    await pushService.unregister();
    await clearAuth();
  },

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await axiosInstance.post('/password-reset/request', { email });
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await axiosInstance.post('/password-reset/reset', { token, password });
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
