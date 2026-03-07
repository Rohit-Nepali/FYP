import * as AuthSession from 'expo-auth-session';
import axios from 'axios';
import { config } from '../config/environment';
import { getStoredTokens } from './authService';

// Configure redirect URI
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'taskora',
  path: 'calendar-callback',
});

// Google Calendar OAuth configuration - Replace with your client IDs
const GOOGLE_CLIENT_ID = '887155577122-3n3mra5upom1c7tcr7jkmb9gnm2isejj.apps.googleusercontent.com';

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

  // Send tokens to backend to store
  const tokens = await getStoredTokens();
  const API_BASE_URL = config.API_BASE_URL;
  
  await axios.post(
    `${API_BASE_URL}/calendar/connect`,
    {
      accessToken: access_token,
      refreshToken: refresh_token,
    },
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    accessToken: access_token,
    refreshToken: refresh_token || '',
  };
};

/**
 * Disconnect Google Calendar
 */
export const disconnectGoogleCalendar = async (): Promise<void> => {
  const tokens = await getStoredTokens();
  const API_BASE_URL = config.API_BASE_URL;

  await axios.post(
    `${API_BASE_URL}/calendar/disconnect`,
    {},
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    }
  );
};

/**
 * Get calendar connection status
 */
export const getCalendarConnectionStatus = async (): Promise<CalendarConnectionStatus> => {
  try {
    const tokens = await getStoredTokens();
    const API_BASE_URL = config.API_BASE_URL;

    const response = await axios.get(`${API_BASE_URL}/calendar/status`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    return response.data.data;
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
  const tokens = await getStoredTokens();
  const API_BASE_URL = config.API_BASE_URL;

  const response = await axios.post(
    `${API_BASE_URL}/calendar/sync`,
    {
      taskId,
      ...eventData,
    },
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.data;
};

/**
 * Get calendar events
 */
export const getCalendarEvents = async (timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> => {
  const tokens = await getStoredTokens();
  const API_BASE_URL = config.API_BASE_URL;

  const response = await axios.get(`${API_BASE_URL}/calendar/events`, {
    params: {
      timeMin,
      timeMax,
    },
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  return response.data.data;
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const tokens = await getStoredTokens();
  const API_BASE_URL = config.API_BASE_URL;

  await axios.delete(`${API_BASE_URL}/calendar/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
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
