import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { config } from '../config/environment';
import { storeTokens } from './apiClient';

// Your WEB CLIENT ID
const API_BASE_URL = config.API_BASE_URL;
const WEB_CLIENT_ID = '495522754350-8gd7jc5jur72iu1rbikp123pahleqtpu.apps.googleusercontent.com';
const GOOGLE_SCOPES = [
  'email',
  'profile',
];

/**
 * Configure Google Sign-In - Call this once when app starts
 */
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: GOOGLE_SCOPES,
  });
  console.log('✅ Google Sign-In configured');
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthResult {
  user: GoogleUser;
  googleId: string;
  accessToken: string;
  refreshToken?: string;
}

interface GoogleSignInOptions {
  forceAccountSelection?: boolean;
}

interface GoogleAuthContext {
  user: GoogleUser;
  googleId: string;
  accessToken: string;
  refreshToken?: string;
  serverAuthCode?: string;
}

const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      fallbackMessage
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

const createGoogleAuthError = (error: unknown, fallbackMessage: string): Error => {
  const authError = new Error(getApiErrorMessage(error, fallbackMessage)) as Error & {
    statusCode?: number;
  };

  if (axios.isAxiosError(error)) {
    authError.statusCode = error.response?.status;
  }

  return authError;
};

const getGoogleAuthContext = async (
  options: GoogleSignInOptions = {}
): Promise<GoogleAuthContext> => {
  console.log('🔵 Checking Play Services...');
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  if (options.forceAccountSelection && GoogleSignin.hasPreviousSignIn()) {
    console.log('🔵 Clearing previous Google session to show account chooser...');
    await GoogleSignin.signOut();
  }

  console.log('🔵 Starting Google Sign-In...');
  const userInfo = await GoogleSignin.signIn();
  console.log('User : ', userInfo);

  if (userInfo.type !== 'success') {
    throw new Error('Google Sign-In was cancelled');
  }

  const googleUser = userInfo.data?.user;
  const serverAuthCode = userInfo.data?.serverAuthCode;

  if (!googleUser) {
    throw new Error('Google Sign-In failed: No user data returned');
  }

  console.log('✅ Google Sign-In successful:', googleUser.email);

  const tokens = await GoogleSignin.getTokens();
  console.log('✅ Got tokens');

  return {
    user: {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
      picture: googleUser.photo || undefined,
    },
    googleId: googleUser.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    serverAuthCode,
  };
};

const authenticateGoogleUser = async (
  endpoint: '/auth/google-signin' | '/auth/google-signup',
  payload: {
    googleId: string;
    email: string;
    name?: string;
    profileImage?: string;
    accessToken: string;
    serverAuthCode?: string;
  },
  fallbackMessage: string
): Promise<GoogleAuthResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

    if (!response.data.success) {
      throw new Error(response.data?.error?.message || fallbackMessage);
    }

    const { user: backendUser, accessToken, refreshToken } = response.data.data;
    await storeTokens(accessToken, refreshToken);

    return {
      user: {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        picture: backendUser.profileImage,
      },
      googleId: payload.googleId,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw createGoogleAuthError(error, fallbackMessage);
  }
};

/**
 * Sign in with Google
 * NOTE: This intentionally uses raw axios (not apiClient) because these are
 * unauthenticated requests — the user doesn't have a JWT token yet.
 */
export const signInWithGoogle = async (
  options: GoogleSignInOptions = {}
): Promise<GoogleAuthResult> => {
  try {
    const googleAuth = await getGoogleAuthContext(options);

    // Authenticate with backend
    console.log('🔵 Authenticating with backend...');

    try {
      const signInResult = await authenticateGoogleUser(
        '/auth/google-signin',
        {
          googleId: googleAuth.googleId,
          email: googleAuth.user.email,
          accessToken: googleAuth.accessToken,
          serverAuthCode: googleAuth.serverAuthCode,
        },
        'Failed to authenticate with Google'
      );

      console.log('✅ Backend authentication successful');

      return signInResult;
    } catch (signInError) {
      const statusCode = (signInError as { statusCode?: number }).statusCode;

      if (statusCode === 404 || statusCode === 409) {
        console.log('🔵 User not found, creating account...');

        const signUpResult = await authenticateGoogleUser(
          '/auth/google-signup',
          {
            googleId: googleAuth.googleId,
            email: googleAuth.user.email,
            name: googleAuth.user.name,
            profileImage: googleAuth.user.picture,
            accessToken: googleAuth.accessToken,
            serverAuthCode: googleAuth.serverAuthCode,
          },
          'Failed to sign up with Google'
        );

        console.log('✅ Account created successfully');
        return signUpResult;
      }

      throw createGoogleAuthError(signInError, 'Failed to authenticate with Google');
    }

  } catch (error: any) {
    console.error('❌ Google Sign-In Error:', error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Play Services not available');
    }

    throw new Error(error.message || 'Sign-in failed');
  }
};

/**
 * Sign up with Google
 */
export const signUpWithGoogle = async (
  options: GoogleSignInOptions = {}
): Promise<GoogleAuthResult> => {
  try {
    const googleAuth = await getGoogleAuthContext(options);

    console.log('🔵 Creating Google account...');
    return await authenticateGoogleUser(
      '/auth/google-signup',
      {
        googleId: googleAuth.googleId,
        email: googleAuth.user.email,
        name: googleAuth.user.name,
        profileImage: googleAuth.user.picture,
        accessToken: googleAuth.accessToken,
        serverAuthCode: googleAuth.serverAuthCode,
      },
      'Failed to sign up with Google'
    );
  } catch (error: any) {
    console.error('❌ Google Sign-Up Error:', error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-up cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-up in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Play Services not available');
    }

    throw new Error(error.message || 'Sign-up failed');
  }
};

/**
 * Sign out
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    console.log('✅ Signed out');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

/**
 * Check if signed in
 */
export const isSignedIn = async (): Promise<boolean> => {
  const user = GoogleSignin.getCurrentUser();

  return !!user;
};