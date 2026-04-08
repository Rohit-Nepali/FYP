import { google } from 'googleapis';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/error.utils.js';
import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/response.utils.js';

// Create OAuth2 client
const createOAuth2Client = () => {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || undefined;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

const ensureGoogleOAuthConfigured = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new ApiError(
      'Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Connect Google Calendar - Store tokens
 */
export const connectCalendarController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { accessToken, refreshToken, serverAuthCode } = req.body;

    ensureGoogleOAuthConfigured();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        googleId: true,
        googleRefreshToken: true,
      },
    });

    if (!user) {
      throw new ApiError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!user.googleId) {
      throw new ApiError(
        'Google Calendar can only be connected by users signed in with Google.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const oauth2Client = createOAuth2Client();
    let resolvedAccessToken = accessToken;
    let resolvedRefreshToken = refreshToken || user.googleRefreshToken;

    if (serverAuthCode) {
      const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI;

      try {

        const tokenResponse = await oauth2Client.getToken(
          configuredRedirectUri
            ? { code: serverAuthCode, redirect_uri: configuredRedirectUri }
            : { code: serverAuthCode, redirect_uri: 'postmessage' }
        );

        resolvedAccessToken = tokenResponse.tokens.access_token || resolvedAccessToken;
        resolvedRefreshToken = tokenResponse.tokens.refresh_token || resolvedRefreshToken;
      } catch (exchangeError) {
        const message =
          exchangeError?.response?.data?.error_description ||
          exchangeError?.response?.data?.error ||
          exchangeError?.message ||
          'Unknown token exchange error';

        console.error('❌ Google Auth Exchange Error:', {
          message,
          error: exchangeError?.response?.data,
          redirectUri: configuredRedirectUri,
        });

        throw new ApiError(
          `Failed to exchange Google server auth code (${message}). Check OAuth client type (Web), client secret, and redirect URI settings.`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    if (!resolvedRefreshToken) {
      throw new ApiError(
        'Could not obtain a Google refresh token. Please sign in with Google again and grant Calendar permissions.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Update user with calendar tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: resolvedRefreshToken,
        calendarConnected: true,
      },
    });

    // Optionally verify the access token by making a test API call
    oauth2Client.setCredentials({
      access_token: resolvedAccessToken,
      refresh_token: resolvedRefreshToken,
    });

    // Get user email from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (userInfo.data.email && userInfo.data.email !== user.email) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          calendarConnected: false,
          googleRefreshToken: user.googleRefreshToken,
        },
      });

      throw new ApiError(
        'Selected Google account does not match your Taskora Google account.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      'Google Calendar connected successfully',
      {
        connected: true,
        email: userInfo.data.email,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Disconnect Google Calendar
 */
export const disconnectCalendarController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Update user to disconnect calendar
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: null,
        calendarConnected: false,
      },
    });

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      'Google Calendar disconnected successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Calendar Connection Status
 */
export const getCalendarStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        calendarConnected: true,
        googleRefreshToken: true,
      },
    });

    if (!user || !user.calendarConnected || !user.googleRefreshToken) {
      return ApiResponse.sendSuccessResponse(
        res,
        HTTP_STATUS.OK,
        SUCCESS_MESSAGES.RETRIEVED,
        { connected: false }
      );
    }

    // Try to get user email 
    try {
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
      });

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      return ApiResponse.sendSuccessResponse(
        res,
        HTTP_STATUS.OK,
        SUCCESS_MESSAGES.RETRIEVED,
        {
          connected: true,
          email: userInfo.data.email,
        }
      );
    } catch (tokenError) {
      // Token is invalid, update status
      await prisma.user.update({
        where: { id: userId },
        data: {
          calendarConnected: false,
          googleRefreshToken: null,
        },
      });

      return ApiResponse.sendSuccessResponse(
        res,
        HTTP_STATUS.OK,
        SUCCESS_MESSAGES.RETRIEVED,
        { connected: false }
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Sync task to Google Calendar
 */
export const syncTaskToCalendarController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId, title, description, startDateTime, endDateTime, timeZone } = req.body;

    // Get user's Google refresh token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        calendarConnected: true,
      },
    });

    if (!user || !user.calendarConnected || !user.googleRefreshToken) {
      throw new ApiError(
        'Google Calendar not connected',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create OAuth2 client and set credentials
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    // Create Google Calendar event
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: startDateTime,
        timeZone: timeZone || 'UTC',
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone || 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Create or update task-calendar link
    await prisma.taskCalendarLink.upsert({
      where: { taskId },
      create: {
        taskId,
        calendarEventId: response.data.id,
        syncDirection: 'to_google',
      },
      update: {
        calendarEventId: response.data.id,
        syncDirection: 'to_google',
        lastSyncedAt: new Date(),
      },
    });

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      'Task synced to Google Calendar',
      response.data
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Pull events from Google Calendar
 */
export const pullCalendarEventsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeMin, timeMax } = req.query;

    // Get user's Google refresh token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        calendarConnected: true,
      },
    });

    if (!user || !user.calendarConnected || !user.googleRefreshToken) {
      throw new ApiError(
        'Google Calendar not connected',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create OAuth2 client and set credentials
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    // Get calendar events
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      response.data.items || []
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete calendar event
 */
export const deleteCalendarEventController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;

    // Get user's Google refresh token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
        calendarConnected: true,
      },
    });

    if (!user || !user.calendarConnected || !user.googleRefreshToken) {
      throw new ApiError(
        'Google Calendar not connected',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create OAuth2 client and set credentials
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    // Delete event
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      'Calendar event deleted'
    );
  } catch (error) {
    next(error);
  }
};
