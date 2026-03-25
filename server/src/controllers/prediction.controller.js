import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { taskRiskPredictionService } from "../services/taskRiskPrediction.service.js";

export const predictTaskRiskController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.body;

    const result = await taskRiskPredictionService.predictTaskRisk({
      taskId,
      userId,
    });

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      result
    );
  } catch (error) {
    next(error);
  }
};
