import {
    ApiResponse,
    HTTP_STATUS,
    SUCCESS_MESSAGES,
} from "../utils/response.utils.js";

import { attachmentService } from "../services/attachment.service.js";

export const uploadTaskAttachmentController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.params;
        const file = req.file;

        if (!file) {
            return ApiResponse.sendErrorResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                "No file uploaded"
            );
        }
        const attachment = await attachmentService.create({
            file: req.file,
            taskId,
            userId,
        });
        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.CREATED,
            SUCCESS_MESSAGES.CREATED,
            attachment
        );

    } catch (error) {

    }
};