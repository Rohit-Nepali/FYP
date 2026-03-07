import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  connectCalendarController,
  disconnectCalendarController,
  getCalendarStatusController,
  syncTaskToCalendarController,
  pullCalendarEventsController,
  deleteCalendarEventController,
} from '../controllers/calendar.controller.js';

const calendarRouter = Router();

// All calendar routes require authentication
calendarRouter.use(authenticateToken);

// Connect Google Calendar
calendarRouter.post('/connect', connectCalendarController);

// Disconnect Google Calendar
calendarRouter.post('/disconnect', disconnectCalendarController);

// Get Calendar Connection Status
calendarRouter.get('/status', getCalendarStatusController);

// Sync Task to Google Calendar
calendarRouter.post('/sync', syncTaskToCalendarController);

// Pull Events from Google Calendar
calendarRouter.get('/events', pullCalendarEventsController);

// Delete Calendar Event
calendarRouter.delete('/events/:eventId', deleteCalendarEventController);

export default calendarRouter;
