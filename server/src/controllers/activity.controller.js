import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { getProjectActivities } from '../services/activity.service.js';
import { prisma } from "../config/db.js";

/**
 * Get activities for a project
 * GET /api/projects/:projectId/activities
 */
export const getActivities = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!project) {
      return ApiResponse.sendErrorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        "You don't have access to this project"
      );
    }

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
