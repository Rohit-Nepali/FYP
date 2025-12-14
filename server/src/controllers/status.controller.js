import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { statusService } from "../services/status.service.js";

export const createStatusController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const statusData = req.body;

    const status = await statusService.create(statusData, userId);

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

    const statuses = await statusService.getAll(userId);

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
    const { id } = req.params;

    const status = await statusService.getById(id, userId);

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
    const { id } = req.params;
    const updateData = req.body;

    const status = await statusService.update(id, userId, updateData);

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
    const { id } = req.params;

    await statusService.delete(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.DELETED
    );
  } catch (error) {
    next(error);
  }
};
