import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { userService } from "../services/user.service.js";

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
