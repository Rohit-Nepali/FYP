import { HTTP_STATUS } from "#utils/response.utils.js";
import { prisma } from "../config/db.js";

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
    }
};
