import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
import { configureGoogleSignIn, signInWithGoogle, signOutFromGoogle, isSignedIn } from '@/services/googleAuthService';
import type { GoogleUser, GoogleAuthResult } from '@/services/googleAuthService';

interface GoogleAuthContextType {
  // State
  user: GoogleUser | null;
  isLoading: boolean;
  isConfigured: boolean;
  
  // Methods
  signIn: () => Promise<GoogleAuthResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Configure Google Sign-In on mount
  useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const initializeGoogleSignIn = async () => {
    try {
      console.log('🔵 Initializing Google Sign-In...');
      
      // Configure
      configureGoogleSignIn();
      setIsConfigured(true);
      
      // Check if user is already signed in
      const signedIn = await isSignedIn();
      
      if (signedIn) {
        console.log('✅ User already signed in, fetching info...');
        await refreshUser();
      }
      
      console.log('✅ Google Sign-In initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Sign-In:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (): Promise<GoogleAuthResult> => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      setUser(result.user);
      return result;
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOutFromGoogle();
      setUser(null);
    } catch (error) {
      console.error('Sign-out failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      setUser({
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name || '',
        picture: userInfo.user.photo || undefined,
      });
    } catch (error) {
      console.log('No user to refresh');
      setUser(null);
    }
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

// Custom hook to use Google Auth
export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  }
  
  return context;
};