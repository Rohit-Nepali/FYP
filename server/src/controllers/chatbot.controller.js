import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { chatbotService } from "../services/chatbot.service.js";

export const postChatbotMessageController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message, taskId } = req.body;

    const result = await chatbotService.handleMessage({
      userId,
      taskId,
      message,
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
