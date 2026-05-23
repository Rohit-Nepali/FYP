import { prisma } from "#config/db.js";
import { ApiError } from "#utils/error.utils.js";
import { HTTP_STATUS } from "#utils/response.utils.js";
import { sendPushNotification } from "./notification.service.js";
import { emailService } from "./email.service.js";

const notifyProjectMembersForTaskAttachment = async ({
  task,
  uploader,
  attachment,
}) => {
  if (!task?.projectId || !task?.project) {
    return;
  }

  const recipients = [];

  if (task.project.owner && task.project.owner.id !== uploader.id) {
    recipients.push(task.project.owner);
  }

  task.project.members.forEach((member) => {
    if (member.user && member.user.id !== uploader.id) {
      recipients.push(member.user);
    }
  });

  const uniqueRecipients = Array.from(
    new Map(recipients.map((recipient) => [recipient.id, recipient])).values()
  );

  for (const recipient of uniqueRecipients) {
    try {
      const notificationTitle = "Task Attachment Added";
      const notificationBody = `${uploader.name || "A teammate"} added ${attachment.fileName} to task: ${task.title || "Untitled"}`;

      if (emailService.isSmtpConfigured() && recipient.email) {
        await emailService.sendTaskAttachmentAddedEmail({
          email: recipient.email,
          recipientName: recipient.name,
          taskTitle: task.title,
          projectTitle: task.project.title,
          fileName: attachment.fileName,
          uploadedByName: uploader.name,
        });
      }

      if (recipient.pushToken) {
        await sendPushNotification(
          recipient.pushToken,
          notificationTitle,
          notificationBody,
          {
            taskId: task.id,
            attachmentId: attachment.id,
            projectId: task.project.id,
            type: "task_attachment_added",
          }
        );
      }
    } catch (error) {
      console.error("Failed to notify project member about task attachment:", {
        taskId: task.id,
        attachmentId: attachment.id,
        recipientId: recipient.id,
        error: error.message,
      });
    }
  }
};


export const attachmentService = {
  create: async ({ file, taskId, userId }) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                pushToken: true,
              },
            },
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    pushToken: true,
                  },
                },
              },
            },
          },
        },
      },
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

    if (task.projectId) {
      const uploader = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (uploader) {
        await notifyProjectMembersForTaskAttachment({
          task,
          uploader,
          attachment,
        });
      }
    }

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
        taskId: null, // Null for project-only attachments
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
