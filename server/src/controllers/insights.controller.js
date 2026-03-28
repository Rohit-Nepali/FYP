import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { userBehaviorInsightsService } from "../services/userBehaviorInsights.service.js";
import { INSIGHTS_MAX_RANGE_DAYS } from "../config/ml.constants.js";
import { ApiError } from "../utils/error.utils.js";

export const getUserBehaviorInsightsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rangeDays = req.query.rangeDays;
    const timezone = req.query.timezone;

    if (rangeDays !== undefined) {
      const parsedRange = Number.parseInt(String(rangeDays), 10);
      if (Number.isNaN(parsedRange) || parsedRange <= 0) {
        throw new ApiError("rangeDays must be a positive integer", HTTP_STATUS.BAD_REQUEST);
      }

      if (parsedRange > INSIGHTS_MAX_RANGE_DAYS) {
        throw new ApiError(
          `rangeDays cannot exceed ${INSIGHTS_MAX_RANGE_DAYS}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    const result = await userBehaviorInsightsService.getUserBehaviorInsights({
      userId,
      rangeDays,
      timezone,
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
