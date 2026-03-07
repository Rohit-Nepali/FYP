import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { config } from '../config/environment';
import { storeTokens } from './authService';

// Your WEB CLIENT ID 
const API_BASE_URL = config.API_BASE_URL;
const WEB_CLIENT_ID = '887155577122-4lrojdh2pm8fh6lmt7ri0jf22unf2q8u.apps.googleusercontent.com';

/**
 * Configure Google Sign-In - Call this once when app starts
 */
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: ['email', 'profile'],
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
  accessToken: string;
  refreshToken?: string;
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    console.log('🔵 Checking Play Services...');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    console.log('🔵 Starting Google Sign-In...');
    const userInfo = await GoogleSignin.signIn();
    console.log("User : ", userInfo);

    const googleUser = userInfo.data?.user;

    if (!googleUser) {
      throw new Error('Google Sign-In failed: No user data returned');
    }

    console.log('✅ Google Sign-In successful:', googleUser.email);

    // Get access token
    const tokens = await GoogleSignin.getTokens();
    console.log('✅ Got tokens');

    const user: GoogleUser = {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
      picture: googleUser.photo || undefined,
    };

    // Authenticate with backend
    console.log('🔵 Authenticating with backend...');

    try {
      // Try sign-in
      const signInResponse = await axios.post(`${API_BASE_URL}/auth/google-signin`, {
        googleId: user.id,
        email: user.email,
        accessToken: tokens.accessToken,
      });

      if (signInResponse.data.success) {
        const { user: backendUser, accessToken, refreshToken } = signInResponse.data.data;
        await storeTokens(accessToken, refreshToken);

        console.log('✅ Backend authentication successful');

        return {
          user: {
            id: backendUser.id,
            email: backendUser.email,
            name: backendUser.name,
            picture: backendUser.profileImage,
          },
          accessToken,
          refreshToken,
        };
      }
    } catch (signInError: any) {
      // If user doesn't exist, sign up
      if (signInError.response?.status === 404 || signInError.response?.status === 409) {
        console.log('🔵 User not found, creating account...');

        const signUpResponse = await axios.post(`${API_BASE_URL}/auth/google-signup`, {
          googleId: user.id,
          email: user.email,
          name: user.name,
          profileImage: user.picture,
          accessToken: tokens.accessToken,
        });

        if (signUpResponse.data.success) {
          const { user: backendUser, accessToken, refreshToken } = signUpResponse.data.data;
          await storeTokens(accessToken, refreshToken);

          console.log('✅ Account created successfully');

          return {
            user: {
              id: backendUser.id,
              email: backendUser.email,
              name: backendUser.name,
              picture: backendUser.profileImage,
            },
            accessToken,
            refreshToken,
          };
        }
      }

      throw signInError;
    }

    throw new Error('Failed to authenticate');

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