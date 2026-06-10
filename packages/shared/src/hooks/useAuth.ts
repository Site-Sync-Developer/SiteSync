import { useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../api/authService';
import type { RegisterInvitationPayload } from '../api/authService';
import { getStoredToken, getStoredUser } from '../utils/storage';
import type { User } from '../models';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadStoredUser = useCallback(async () => {
    // Race against a 5-second timeout so a hanging AsyncStorage call never
    // leaves the app stuck on the loading screen.
    const timeout = <T,>(p: Promise<T>): Promise<T | null> =>
      Promise.race([p, new Promise<null>((res) => setTimeout(() => res(null), 5000))]);

    try {
      const token = await timeout(getStoredToken());
      const userJson = token ? await timeout(getStoredUser()) : null;
      if (token && userJson) {
        try {
          const parsed = JSON.parse(userJson) as User;
          setUser(parsed);
          setIsAuthenticated(true);
        } catch {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // AsyncStorage unavailable — treat as unauthenticated
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredUser();
  }, [loadStoredUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    setUser(res.user);
    setIsAuthenticated(true);
    return res;
  }, []);

  const registerInvitation = useCallback(async (payload: RegisterInvitationPayload) => {
    const res = await authService.registerInvitation(payload);
    setUser(res.user);
    setIsAuthenticated(true);
    return res;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const u = await authService.changePassword(currentPassword, newPassword);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const mustChangePassword = useMemo(() => Boolean(user?.must_change_password), [user]);

  return {
    user,
    loading,
    isAuthenticated,
    mustChangePassword,
    login,
    registerInvitation,
    changePassword,
    logout,
    refreshUser: loadStoredUser,
  };
}
