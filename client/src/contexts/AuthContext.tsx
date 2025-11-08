import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  refreshToken as authRefreshToken,
  getProfile,
  storeTokens,
  getStoredTokens,
  clearTokens,
} from "../services/authService";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const tokens = await getStoredTokens();
      if (tokens.accessToken) {
        // Verify token and get user profile
        const userProfile = await getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.log("Auth initialization failed:", error);
      // Clear any invalid tokens
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authLogin(email, password);

      // Store tokens
      await storeTokens(response.accessToken, response.refreshToken);

      // Set user
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authRegister(name, email, password);

      // Store tokens
      await storeTokens(response.accessToken, response.refreshToken);

      // Set user
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authLogout();
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      // Clear local state regardless of API call success
      await clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const tokens = await getStoredTokens();
      if (tokens.refreshToken) {
        const response = await authRefreshToken(tokens.refreshToken);
        await storeTokens(response.accessToken, response.refreshToken);
      }
    } catch (error) {
      console.log("Token refresh failed:", error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
