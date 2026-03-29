import {
  GoogleSignin,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { makeRequest } from './apiClient';

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export interface CalendarConnectionStatus {
  connected: boolean;
  email?: string;
}

// ─── Public API Functions ────────────────────────────────────────────────────

/**
 * Connect Google Calendar using the existing Google Sign-In session.
 * This requests calendar scopes from the signed-in Google account.
 */
export const connectGoogleCalendar = async (): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 1. Get current user
    const currentUser = await GoogleSignin.getCurrentUser();

    // In v16, currentUser.data.scopes is an array of strings
    const currentScopes = currentUser?.data?.scopes || [];

    // Check if every required calendar scope is already present
    const hasScopes = CALENDAR_SCOPES.every(scope => currentScopes.includes(scope));

    let userInfo;

    if (!currentUser || !hasScopes) {
      // 2. If no user OR missing scopes, trigger sign-in with the specific scopes
      // This will prompt the user to "Select Account" and "Grant Permissions"
      userInfo = await GoogleSignin.signIn({
        // Optional: force account selection to ensure they pick the right one
        // forceAccountSelection: true 
      });
    } else {
      // 3. User is already logged in and has scopes
      userInfo = currentUser;
    }

    if (!isSuccessResponse(userInfo)) {
      throw new Error('Sign in failed or was cancelled');
    }

    // 4. Get the fresh tokens
    const { accessToken } = await GoogleSignin.getTokens();
    const serverAuthCode = userInfo.data.serverAuthCode;

    if (!serverAuthCode) {
      throw new Error('No serverAuthCode received. Ensure offlineAccess: true is in your GoogleSignin.configure');
    }

    // 5. Send to backend
    await makeRequest('/calendar/connect', {
      method: 'POST',
      data: { accessToken, serverAuthCode },
    });

    return { accessToken, refreshToken: '' };

  } catch (error: any) {
    // Standard error handling...
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Calendar authorization was cancelled');
    }
    throw new Error(error?.message || 'Failed to connect Google Calendar');
  }
};

/**
 * Disconnect Google Calendar
 */
export const disconnectGoogleCalendar = async (): Promise<void> => {
  await makeRequest('/calendar/disconnect', {
    method: 'POST',
  });
};

/**
 * Get calendar connection status
 */
export const getCalendarConnectionStatus = async (): Promise<CalendarConnectionStatus> => {
  try {
    return await makeRequest<CalendarConnectionStatus>('/calendar/status', {
      method: 'GET',
    });
  } catch {
    return { connected: false };
  }
};

/**
 * Sync a task to Google Calendar
 */
export const syncTaskToCalendar = async (taskId: string, eventData: {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
}): Promise<CalendarEvent> => {
  return makeRequest<CalendarEvent>('/calendar/sync', {
    method: 'POST',
    data: {
      taskId,
      ...eventData,
    },
  });
};

/**
 * Get calendar events
 */
export const getCalendarEvents = async (timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> => {
  return makeRequest<CalendarEvent[]>('/calendar/events', {
    method: 'GET',
    params: { timeMin, timeMax },
  });
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  await makeRequest(`/calendar/events/${eventId}`, {
    method: 'DELETE',
  });
};

/**
 * Backward-compatible helper for any consumer that still reads auth config.
 */
export const getCalendarAuthConfig = () => ({
  scopes: CALENDAR_SCOPES,
});
