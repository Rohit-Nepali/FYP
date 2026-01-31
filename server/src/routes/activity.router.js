import express from 'express';
import { Router } from "express";
import { getActivities } from '../controllers/activity.controller.js';

const router = Router();

// Get activities for a project
router.get('/projects/:projectId/activities', getActivities);

export default router;

