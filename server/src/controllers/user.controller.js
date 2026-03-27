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

export const getNotificationsController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const unreadOnly = req.query.unreadOnly === "true";
        const archivedOnly = req.query.archivedOnly === "true";

        const notifications = await userService.getNotifications(userId, unreadOnly, archivedOnly);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            notifications
        );
    } catch (error) {
        next(error);
    }
};

export const getUnreadNotificationCountController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const unreadCount = await userService.getNotificationUnreadCount(userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            { unreadCount }
        );
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsReadController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        await userService.markNotificationRead(notificationId, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED
        );
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsIgnoredController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        await userService.markNotificationIgnored(notificationId, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED
        );
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsAsReadController = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await userService.markAllNotificationsRead(userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED
        );
    } catch (error) {
        next(error);
    }
};

export const archiveNotificationController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        await userService.archiveNotification(notificationId, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED
        );
    } catch (error) {
        next(error);
    }
};

export const unarchiveNotificationController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        await userService.unarchiveNotification(notificationId, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED
        );
    } catch (error) {
        next(error);
    }
};

export const deleteNotificationController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        await userService.deleteNotification(notificationId, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.DELETED
        );
    } catch (error) {
        next(error);
    }
};

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

export const updateDigestPreferencesController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { timezone, dailyDigestEnabled, digestHourLocal } = req.body;

        const updated = await userService.updateDigestPreferences(userId, {
            timezone,
            dailyDigestEnabled,
            digestHourLocal,
        });

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED,
            updated
        );
    } catch (error) {
        next(error);
    }
};
