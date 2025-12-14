import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { priorityService } from "../services/priority.service.js";

export const createPriorityController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const priorityData = req.body;

    const priority = await priorityService.create(priorityData, userId);

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

    const priorities = await priorityService.getAll(userId);

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
    const { id } = req.params;

    const priority = await priorityService.getById(id, userId);

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
    const { id } = req.params;
    const updateData = req.body;

    const priority = await priorityService.update(id, userId, updateData);

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
    const { id } = req.params;

    await priorityService.delete(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.DELETED
    );
  } catch (error) {
    next(error);
  }
};
