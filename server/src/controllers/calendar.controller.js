import { google } from 'googleapis';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/error.utils.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/response.utils.js';

// Create OAuth2 client
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Connect Google Calendar - Store tokens
 */
export const connectCalendarController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { accessToken, refreshToken } = req.body;

    // Update user with calendar tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: refreshToken,
        calendarConnected: true,
      },
    });

    // Optionally verify the access token by making a test API call
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Get user email from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

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

    // Try to get user email (验证 token 是否有效)
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
