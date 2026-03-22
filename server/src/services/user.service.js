import { HTTP_STATUS } from "#utils/response.utils.js";
import { prisma } from "../config/db.js";
import { ApiError } from "#utils/error.utils.js";
import {
    getInAppNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "./notification.service.js";

export const userService = {
    searchUsers: async (query) => {
        if (!query) return [];

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
            },
            take: 10,
        });

        return users.map(user => ({
            ...user,
            avatarUrl: user.profileImage
        }));
    },

    addPushToken: async (userId, pushToken) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select:{
                id: true,
                pushToken: true
            }
        });

        if (!user) {
            throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
        }

        if (user.pushToken === pushToken) return user;

        return await prisma.user.update({
            where: { id: userId },
            data: {
                pushToken: pushToken,
            },
            select:{
                id: true,
                pushToken: true
            }
        });
    },

    updateUserProfile: async (userId, { name, email, profileImage }) => {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                googleId: true
            }
        });

        if (!existingUser) {
            throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email }
            });
            if (emailExists) {
                throw new ApiError("Email already in use", HTTP_STATUS.CONFLICT);
            }
        }

        // Google users cannot change their email
        if (existingUser.googleId && email && email !== existingUser.email) {
            throw new ApiError("Cannot change email for Google-signed-in accounts", HTTP_STATUS.FORBIDDEN);
        }

        // Build update data
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                profileImage: true,
                createdAt: true,
                googleId: true
            }
        });

        return updatedUser;
    },

    updateAvatar: async (userId, file) => {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });

        if (!existingUser) {
            throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
        }

        const baseUrl =
            process.env.FILE_BASE_URL ||
            process.env.BACKEND_URL ||
            "";

        const relativePath = `/uploads/avatars/${file.filename}`;
        const avatarUrl = baseUrl ? `${baseUrl}${relativePath}` : relativePath;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                profileImage: avatarUrl,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                profileImage: true,
                createdAt: true,
                googleId: true,
            },
        });

        return updatedUser;
    },

    getNotifications: async (userId, unreadOnly = false) => {
        return getInAppNotifications(userId, { unreadOnly });
    },

    getNotificationUnreadCount: async (userId) => {
        return getUnreadNotificationCount(userId);
    },

    markNotificationRead: async (notificationId, userId) => {
        const result = await markNotificationAsRead(notificationId, userId);

        if (!result.count) {
            throw new ApiError("Notification not found", HTTP_STATUS.NOT_FOUND);
        }

        return true;
    },

    markAllNotificationsRead: async (userId) => {
        await markAllNotificationsAsRead(userId);
        return true;
    }
};
