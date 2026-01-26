import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { userService } from "../services/user.service.js";
import { ApiError } from "#utils/error.utils.js";

export const searchUsersController = async (req, res, next) => {
    try {
        const { search } = req.query;
        const users = await userService.searchUsers(search);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            users
        );
    } catch (error) {
        next(error);
    }
};

export const addPushTokenController = async (req, res, next) => {
    try {
        const { pushToken } = req.body;
        const userId = req.user.id;

        if (!pushToken) {
            throw new ApiError("Push token is required", HTTP_STATUS.BAD_REQUEST);
        }

        const user = await userService.addPushToken(userId, pushToken);
        console.log("Push notificaton for user !")

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED,
            user
        );

    }
    catch (error) {
        next(error);
    }
}
