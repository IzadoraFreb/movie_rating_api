'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, ApiError, getToken, message, setToken } from '@/lib/api';
import type { User } from '@/lib/types';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  logout: () => void;
}>({
  user: null,
  loading: true,
  error: '',
  refresh: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    try {
      const user = await api<User>('/users/me');
      if (version === requestVersion.current) {
        setUser(user);
        setError('');
      }
    } catch (error) {
      if (version === requestVersion.current) {
        setUser(null);
        setError(
          error instanceof ApiError && error.status === 401
            ? ''
            : message(error),
        );
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    const version = ++requestVersion.current;
    const initial = getToken() ? api<User>('/users/me') : Promise.resolve(null);
    initial
      .then((user) => {
        if (active && version === requestVersion.current) setUser(user);
      })
      .catch((error: unknown) => {
        if (active && version === requestVersion.current)
          setError(
            error instanceof ApiError && error.status === 401
              ? ''
              : message(error),
          );
      })
      .finally(() => {
        if (active && version === requestVersion.current) setLoading(false);
      });
    const listener = () => {
      void refresh();
    };
    window.addEventListener('auth-change', listener);
    window.addEventListener('storage', listener);
    return () => {
      active = false;
      window.removeEventListener('auth-change', listener);
      window.removeEventListener('storage', listener);
    };
  }, [refresh]);
  return (
    <AuthContext
      value={{ user, loading, error, refresh, logout: () => setToken(null) }}
    >
      {children}
    </AuthContext>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
export function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!auth.loading && !auth.user && !getToken())
      router.replace('/login?next=' + encodeURIComponent(pathname));
  }, [auth.loading, auth.user, pathname, router]);
  if (auth.loading)
    return (
      <div className="state" role="status">
        Carregando sua conta…
      </div>
    );
  if (auth.error)
    return (
      <div className="state">
        <p role="alert">{auth.error}</p>
        <button className="button" onClick={() => void auth.refresh()}>
          Tentar novamente
        </button>
      </div>
    );
  if (!auth.user)
    return (
      <div className="state" role="status">
        Abrindo o login…
      </div>
    );
  if (admin && auth.user.role !== 'ADMIN')
    return (
      <div className="state">
        <h1>Acesso restrito</h1>
        <p>Esta área é exclusiva da administração.</p>
        <a className="button" href="/minha-area">
          Ir para minha área
        </a>
      </div>
    );
  return children;
}
