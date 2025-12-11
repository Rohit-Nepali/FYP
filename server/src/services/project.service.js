import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../utils/response.utils.js";

export const projectService = {
    create: async (projectData, ownerId) => {
        const { title, description } = projectData;

        const project = await prisma.project.create({
            data: {
                title,
                description,
                ownerId,
            },
            include: {
                owner: {
                    select: { id: true, name: true, email: true, profileImage: true },
                },
                members: true,
            },
        });

        return project;
    },

    getAll: async (userId) => {
        const projects = await prisma.project.findMany({
            where: {
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            },
            include: {
                owner: { select: { id: true, name: true, email: true, profileImage: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, profileImage: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return projects;
    },

    getById: async (projectId, userId) => {
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            },
            include: {
                owner: { select: { id: true, name: true, email: true, profileImage: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, profileImage: true } },
                    },
                },
                tasks: {
                    include: {
                        assignee: {
                            select: { id: true, name: true, email: true, profileImage: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!project) {
            throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }

        return project;
    },

    update: async (projectId, userId, updateData) => {
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: userId },
        });

        if (!project) {
            throw new ApiError(
                "Only the project owner can update this project",
                HTTP_STATUS.FORBIDDEN
            );
        }

        const { title, description } = updateData;

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
            },
            include: {
                owner: { select: { id: true, name: true, email: true, profileImage: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, profileImage: true } },
                    },
                },
            },
        });

        return updated;
    },

    delete: async (projectId, userId) => {
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: userId },
        });

        if (!project) {
            throw new ApiError(
                "Only the project owner can delete this project",
                HTTP_STATUS.FORBIDDEN
            );
        }

        await prisma.project.delete({ where: { id: projectId } });
    },

    addMember: async (projectId, userId, memberId, role = "member") => {
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: userId },
        });

        if (!project) {
            throw new ApiError(
                "Only the project owner can add members",
                HTTP_STATUS.FORBIDDEN
            );
        }

        if (memberId === userId) {
            throw new ApiError("Owner is already part of the project", HTTP_STATUS.BAD_REQUEST);
        }

        const existingMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: memberId,
                },
            },
        });

        if (existingMember) {
            throw new ApiError(
                "User is already a member of this project",
                HTTP_STATUS.BAD_REQUEST
            );
        }

        await prisma.projectMember.create({
            data: {
                projectId,
                userId: memberId,
                role,
            },
        });

        return projectService.getById(projectId, userId);
    },

    removeMember: async (projectId, userId, memberId) => {
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: userId },
        });

        if (!project) {
            throw new ApiError(
                "Only the project owner can remove members",
                HTTP_STATUS.FORBIDDEN
            );
        }

        if (memberId === userId) {
            throw new ApiError("Owner cannot be removed", HTTP_STATUS.BAD_REQUEST);
        }

        await prisma.projectMember.deleteMany({
            where: {
                projectId,
                userId: memberId,
            },
        });

        // Unassign tasks for the removed member
        await prisma.task.updateMany({
            where: { projectId, assigneeId: memberId },
            data: { assigneeId: null },
        });

        return projectService.getById(projectId, userId);
    },
};

