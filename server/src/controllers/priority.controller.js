import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { priorityService } from "../services/priority.service.js";

export const createPriorityController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const priorityData = req.body;

    const priority = await priorityService.create(priorityData, projectId || null, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.CREATED,
      priority
    );
  } catch (error) {
    next(error);
  }
};

export const getAllPrioritiesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const priorities = await priorityService.getAll(projectId || null, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      priorities
    );
  } catch (error) {
    next(error);
  }
};

export const getPriorityByIdController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, id } = req.params;

    const priority = await priorityService.getById(id, projectId || null, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      priority
    );
  } catch (error) {
    next(error);
  }
};

export const updatePriorityController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, id } = req.params;
    const updateData = req.body;

    const priority = await priorityService.update(id, projectId || null, userId, updateData);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.UPDATED,
      priority
    );
  } catch (error) {
    next(error);
  }
};

export const deletePriorityController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, id } = req.params;

    await priorityService.delete(id, projectId || null, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.DELETED
    );
  } catch (error) {
    next(error);
  }
};

// New: Get global priorities (no projectId required)
export const getGlobalPrioritiesController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const priorities = await priorityService.getGlobal(userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      priorities
    );
  } catch (error) {
    next(error);
  }
};
