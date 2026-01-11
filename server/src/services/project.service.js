import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../utils/response.utils.js";
import crypto from "crypto";
import { emailService } from "./email.service.js";

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
                ownerId: userId
            }
            // where: {
            //     OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            // },
            // include: {
            //     owner: { select: { id: true, name: true, email: true, profileImage: true } },
            //     members: {
            //         include: {
            //             user: { select: { id: true, name: true, email: true, profileImage: true } },
            //         },
            //     },
            // },
            // orderBy: { createdAt: "desc" },
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

    createInvite: async (projectId, userId, email, role = "member") => {
        // Only project owner can invite (you can loosen this to project admins later)
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: userId },
        });


        if (!project) {
            throw new ApiError(
                "Only the project owner can create invites",
                HTTP_STATUS.FORBIDDEN
            );
        }

        // If user already exists, add as member directly
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return await projectService.addMember(
                projectId,
                userId,
                existingUser.id,
                role
            );
        }

        // Check for existing invite for this email
        const existingInvite = await prisma.projectInvite.findFirst({
            where: {
                projectId,
                email,
            },
        });

        if (existingInvite) {
            throw new ApiError(
                "An invite for this email already exists",
                HTTP_STATUS.BAD_REQUEST
            );
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");

        // Expires in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await prisma.projectInvite.create({
            data: {
                email,
                projectId,
                role,
                token,
                invitedById: userId,
                expiresAt,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Construct invite link (adjust the base URL as needed for your frontend)
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/invite/${token}`;
        const invitedBy = invite.invitedBy.name || 'A team member';

        // Send invite email
        emailService.sendProjectInviteEmail(email, project.title, inviteLink, invitedBy);

        return invite;

    },

    acceptInvite: async (token, userId) => {
        const invite = await prisma.projectInvite.findUnique({
            where: { token },
            include: {
                project: true,
            },
        });

        if (!invite) {
            throw new ApiError("Invalid invite token", HTTP_STATUS.NOT_FOUND);
        }

        if (invite.expiresAt < new Date()) {
            throw new ApiError("Invite has expired", HTTP_STATUS.BAD_REQUEST);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.email !== invite.email) {
            throw new ApiError(
                "This invite is not for your email address",
                HTTP_STATUS.FORBIDDEN
            );
        }

        // Add user to project (owner / inviter is invite.invitedById)
        await projectService.addMember(
            invite.projectId,
            invite.invitedById,
            userId,
            invite.role
        );

        // Delete the invite
        await prisma.projectInvite.delete({
            where: { id: invite.id },
        });

        // Return updated project
        return await projectService.getById(invite.projectId, userId);
    },

    getInvites: async (projectId, userId) => {
        // Only owner can view invites (adjust as needed)
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                ownerId: userId,
            },
        });

        if (!project) {
            throw new ApiError(
                "Only the project owner can view invites",
                HTTP_STATUS.FORBIDDEN
            );
        }

        const invites = await prisma.projectInvite.findMany({
            where: { projectId },
            include: {
                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return invites;
    },

};

