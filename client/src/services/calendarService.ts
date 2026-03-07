import * as AuthSession from 'expo-auth-session';
import { makeRequest } from './apiClient';

// Configure redirect URI
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'taskora',
  path: 'calendar-callback',
});

// Google Calendar OAuth configuration - Replace with your client IDs
const GOOGLE_CLIENT_ID = '887155577122-3n3mra5upom1c7tcr7jkmb9gnm2isejj.apps.googleusercontent.com';

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
 * Start the Google Calendar OAuth flow
 */
export const connectGoogleCalendar = async (): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  // Create auth request for Calendar scope
  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    redirectUri,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
    usePKCE: true,
  });

  // Get discovery document
  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

  // Prompt user for authorization
  const result = await request.promptAsync(discovery, {
    windowFeatures: {
      width: 520,
      height: 680,
    },
  });

  if (result.type !== 'success') {
    throw new Error('Calendar authorization was cancelled');
  }

  const { access_token, refresh_token } = result.params;

  if (!access_token) {
    throw new Error('No access token received');
  }

  // Send tokens to backend to store (uses shared apiClient with auth interceptor)
  await makeRequest('/calendar/connect', {
    method: 'POST',
    data: {
      accessToken: access_token,
      refreshToken: refresh_token,
    },
  });

  return {
    accessToken: access_token,
    refreshToken: refresh_token || '',
  };
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
 * Get Google Auth config for Calendar (for use with useAuthRequest hook)
 */
export const getCalendarAuthConfig = () => ({
  clientId: GOOGLE_CLIENT_ID,
  redirectUri,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  extraParams: {
    access_type: 'offline',
    prompt: 'consent',
  },
});
