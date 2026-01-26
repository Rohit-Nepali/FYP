import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { statusService } from "../services/status.service.js";

export const createStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const statusData = req.body;

    const status = await statusService.create(statusData, projectId, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.CREATED,
      status
    );
  } catch (error) {
    next(error);
  }
};

export const getAllStatusesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const statuses = await statusService.getAll(projectId, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      statuses
    );
  } catch (error) {
    next(error);
  }
};

export const getStatusByIdController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, id } = req.params;

    const status = await statusService.getById(id, projectId, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      status
    );
  } catch (error) {
    next(error);
  }
};

export const updateStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, id } = req.params;
    const updateData = req.body;

    const status = await statusService.update(id, projectId, userId, updateData);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.UPDATED,
      status
    );
  } catch (error) {
    next(error);
  }
};

export const deleteStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, id } = req.params;

    await statusService.delete(id, projectId, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.DELETED
    );
  } catch (error) {
    next(error);
  }
};
