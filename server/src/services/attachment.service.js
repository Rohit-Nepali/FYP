import { prisma } from "#config/db.js";
import { ApiError } from "#utils/error.utils.js";
import { HTTP_STATUS } from "#utils/response.utils.js";


export const attachmentService = {
  create: async ({ file, taskId, userId }) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new ApiError("Task not found", HTTP_STATUS.NOT_FOUND);
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        projectId: task.projectId, // Auto-set projectId from task
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/tasks/${file.filename}`,
        uploadedBy: userId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    return attachment;
  },

  getByProject: async (projectId, userId) => {
    // Get direct project attachments and task attachments for this project
    const attachments = await prisma.attachment.findMany({
      where: {
        OR: [
          { projectId: projectId }, // Direct project attachments
          {
            task: {
              projectId: projectId,
            },
          },
        ],
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return attachments;
  },

  createProjectAttachment: async ({ file, projectId, userId }) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId: "", // Empty string for project-only attachments
        projectId: projectId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/projects/${file.filename}`,
        uploadedBy: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return attachment;
  },

  delete: async (attachmentId, userId) => {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: true,
        project: true,
      },
    });

    if (!attachment) {
      throw new ApiError("Attachment not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check if user has permission to delete
    // User can delete if they are the uploader, or project owner, or task creator
    const isUploader = attachment.uploadedBy === userId;
    const isProjectOwner = attachment.project?.ownerId === userId;
    const isTaskCreator = attachment.task?.creatorId === userId;

    if (!isUploader && !isProjectOwner && !isTaskCreator) {
      throw new ApiError("You don't have permission to delete this attachment", HTTP_STATUS.FORBIDDEN);
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  },
};
