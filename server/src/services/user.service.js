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
};
