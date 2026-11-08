import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { api, UNAUTHORIZED_EVENT } from '@/lib/api';
import { tokenStorage } from '@/lib/token-storage';
import { AuthContext, type AuthContextValue, type AuthUser } from './auth-context';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>(() =>
    tokenStorage.get() ? 'loading' : 'anonymous',
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  // Restaura a sessão a partir do token salvo.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    const controller = new AbortController();
    api<AuthUser>('/auth/me', { signal: controller.signal })
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        logout();
      });
    return () => controller.abort();
  }, [logout]);

  // Qualquer 401 da API encerra a sessão.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    tokenStorage.set(res.accessToken);
    setUser(res.user);
    setStatus('authenticated');
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
