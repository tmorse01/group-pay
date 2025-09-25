import { createContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMe, useLogin, useLogout } from '../services/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading: isLoadingUser } = useMe();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Check if user has token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token && user) {
      // If no token but we have user data, something's wrong - clear it
      logoutMutation.mutate();
    }
  }, [user, logoutMutation]);

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const isAuthenticated = !!user && !!localStorage.getItem('auth_token');
  const isLoading =
    isLoadingUser || loginMutation.isPending || logoutMutation.isPending;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        login,
        logout,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
