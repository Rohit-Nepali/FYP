import {
    ApiResponse,
    HTTP_STATUS,
    SUCCESS_MESSAGES,
} from "../utils/response.utils.js";

import { attachmentService } from "../services/attachment.service.js";
import { logActivity } from "../services/activity.service.js";
import { prisma } from "../config/db.js";

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

        // Get task details WITH project info for access validation
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            select: { 
                id: true, 
                title: true, 
                projectId: true,
                creatorId: true,
                project: {
                    select: {
                        ownerId: true,
                        members: {
                            select: { userId: true }
                        }
                    }
                }
            }
        });

        if (!task) {
            return ApiResponse.sendErrorResponse(
                res,
                HTTP_STATUS.NOT_FOUND,
                "Task not found"
            );
        }

        // AUTHORIZATION CHECK: Validate user has access to this task
        const isTaskCreator = task.creatorId === userId;
        const isProjectOwner = task.project?.ownerId === userId;
        const isProjectMember = task.project?.members?.some(m => m.userId === userId);

        // For standalone tasks: only creator can upload
        if (!task.projectId) {
            if (!isTaskCreator) {
                return ApiResponse.sendErrorResponse(
                    res,
                    HTTP_STATUS.FORBIDDEN,
                    "You don't have permission to upload files to this task"
                );
            }
        }
        // For project tasks: creator, owner, or member can upload
        else {
            if (!isTaskCreator && !isProjectOwner && !isProjectMember) {
                return ApiResponse.sendErrorResponse(
                    res,
                    HTTP_STATUS.FORBIDDEN,
                    "Not a member of this project"
                );
            }
        }

        const attachment = await attachmentService.create({
            file: req.file,
            taskId,
            userId,
        });

        // Log activity
        if (task && task.projectId) {
            await logActivity({
                type: 'ATTACHMENT_ADDED',
                projectId: task.projectId,
                userId,
                taskId: task.id,
                metadata: { fileName: attachment.fileName, attachmentId: attachment.id }
            });
        }

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.CREATED,
            SUCCESS_MESSAGES.CREATED,
            attachment
        );

    } catch (error) {
        next(error);
    }
};

export const deleteTaskAttachmentController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { taskId, attachmentId } = req.params;

        // Get attachment details before deletion for activity logging
        const attachment = await prisma.attachment.findUnique({
            where: { id: attachmentId },
            select: { id: true, fileName: true, taskId: true }
        });

        if (!attachment || attachment.taskId !== taskId) {
            return ApiResponse.sendErrorResponse(
                res,
                HTTP_STATUS.NOT_FOUND,
                "Attachment not found"
            );
        }

        // Verify user has access to the task
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                OR: [
                    { creatorId: userId },
                    {
                        project: {
                            OR: [
                                { ownerId: userId },
                                { members: { some: { userId } } },
                            ],
                        },
                    },
                ],
            },
        });

        if (!task) {
            return ApiResponse.sendErrorResponse(
                res,
                HTTP_STATUS.FORBIDDEN,
                "You don't have access to this task"
            );
        }

        await attachmentService.delete(attachmentId, userId);

        // Log activity
        if (task.projectId) {
            await logActivity({
                type: 'ATTACHMENT_DELETED',
                projectId: task.projectId,
                userId,
                taskId: task.id,
                metadata: { fileName: attachment.fileName, attachmentId: attachment.id }
            });
        }

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            "Attachment deleted successfully"
        );
    } catch (error) {
        next(error);
    }
};