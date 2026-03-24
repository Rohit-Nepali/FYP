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
  LoginResponse,
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
  isAuthChecking: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUserFromGoogle: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
      await clearTokens();
    } finally {
      setIsAuthChecking(false);
    }
  };

  const login = async (email: string, password: string) => {

    const response: LoginResponse | null = await authLogin(email, password);
    if (!response) {
      throw new Error("INVALID_CREDENTIALS");
    }

    await storeTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    await authRegister(name, email, password);
  };

  const logout = async () => {

    await authLogout();

    // Clear local state regardless of API call success
    await clearTokens();
    setUser(null);
  }

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

  // Set user from Google Sign-In (called after successful Google auth)
  const setUserFromGoogle = (user: User) => {
    setUser(user);
  };

  const value: AuthContextType = {
    user,
    isAuthChecking,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    setUserFromGoogle,
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
