import { createContext } from 'react';
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

  // Removed the problematic useEffect that was checking localStorage
  // since we're now using httpOnly cookies for auth

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  // Since we're using cookies, just check if we have a user
  const isAuthenticated = !!user;
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
