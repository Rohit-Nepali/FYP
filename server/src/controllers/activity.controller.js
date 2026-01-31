import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { getProjectActivities } from '../services/activity.service.js';

/**
 * Get activities for a project
 * GET /api/projects/:projectId/activities
 */
export const getActivities = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await getProjectActivities(
      projectId,
      parseInt(page),
      parseInt(limit)
    );

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      result.data,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};
