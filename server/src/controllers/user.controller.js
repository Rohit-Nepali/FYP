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

export const updateProfileController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, email, profileImage } = req.body;

        // Validate input
        if (!name && !email && !profileImage) {
            throw new ApiError("At least one field to update is required", HTTP_STATUS.BAD_REQUEST);
        }

        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new ApiError("Invalid email format", HTTP_STATUS.BAD_REQUEST);
            }
        }

        const updatedUser = await userService.updateUserProfile(userId, {
            name,
            email,
            profileImage
        });

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED,
            updatedUser
        );
    } catch (error) {
        next(error);
    }
};

export const uploadAvatarController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            throw new ApiError("No file uploaded", HTTP_STATUS.BAD_REQUEST);
        }

        const updatedUser = await userService.updateAvatar(userId, file);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED,
            updatedUser
        );
    } catch (error) {
        next(error);
    }
};
