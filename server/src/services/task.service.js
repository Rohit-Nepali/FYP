import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";
import { sendPushNotification } from "./notification.service.js";
import { emailService } from "./email.service.js";

const assignmentNotificationDelayMs = Number.parseInt(
  process.env.ASSIGN_NOTIFICATION_DELAY_MS || "5000",
  10
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendTaskAssignmentAlerts = async ({ task, assignedByUserId }) => {
  if (!task?.assignee || !task?.project?.id) {
    return;
  }

  try {
    const assigner = assignedByUserId
      ? await prisma.user.findUnique({
          where: { id: assignedByUserId },
          select: { name: true },
        })
      : null;

    console.log("[TaskAssignmentNotification] Triggered", {
      taskId: task.id,
      assigneeId: task.assignee.id,
      assigneeEmail: task.assignee.email,
      hasPushToken: Boolean(task.assignee.pushToken),
      hasProject: Boolean(task.project?.id),
      delayMs: assignmentNotificationDelayMs,
    });

    if (emailService.isSmtpConfigured() && task.assignee.email) {
      await emailService.sendTaskAssignmentEmail({
        email: task.assignee.email,
        assigneeName: task.assignee.name,
        taskTitle: task.title,
        projectTitle: task.project.title,
        assignedByName: assigner?.name,
      });

      console.log("[TaskAssignmentNotification] Email sent", {
        taskId: task.id,
        assigneeId: task.assignee.id,
      });
    } else {
      console.log("[TaskAssignmentNotification] Email skipped", {
        taskId: task.id,
        assigneeId: task.assignee.id,
        smtpConfigured: emailService.isSmtpConfigured(),
        hasAssigneeEmail: Boolean(task.assignee.email),
      });
    }

    if (task.assignee.pushToken) {
      if (assignmentNotificationDelayMs > 0) {
        console.log("[TaskAssignmentNotification] Delaying push", {
          taskId: task.id,
          assigneeId: task.assignee.id,
          delayMs: assignmentNotificationDelayMs,
        });
        await delay(assignmentNotificationDelayMs);
      }

      console.log("[TaskAssignmentNotification] Sending push", {
        taskId: task.id,
        assigneeId: task.assignee.id,
      });

      await sendPushNotification(
        task.assignee.pushToken,
        "Task Assigned",
        `You have been assigned to task: ${task.title}`,
        { taskId: task.id, type: "task_assigned" }
      );

      console.log("[TaskAssignmentNotification] Push sent", {
        taskId: task.id,
        assigneeId: task.assignee.id,
      });
    } else {
      console.log("[TaskAssignmentNotification] Push skipped - no token", {
        taskId: task.id,
        assigneeId: task.assignee.id,
      });
    }
  } catch (error) {
    console.error("Failed to send assignment notification:", error);
  }
};

export const taskService = {
  create: async (taskData, userId) => {
    const { title, description, isCompleted, statusId, priorityId, dueDate, projectId, assigneeId } = taskData;
    const normalizedStatusId = statusId || null;
    const normalizedPriorityId = priorityId || null;

    if (dueDate) {
      const parsedDueDate = new Date(dueDate);
      if (parsedDueDate < new Date()) {
        throw new ApiError("Due date cannot be in the past", HTTP_STATUS.BAD_REQUEST);
      }
    }

    if (normalizedStatusId) {
      const status = await prisma.status.findFirst({
        where: { id: normalizedStatusId, projectId },
      });
      if (!status) {
        throw new ApiError("Status not found or does not belong to this project", HTTP_STATUS.NOT_FOUND);
      }
    }

    if (normalizedPriorityId) {
      const priority = await prisma.priority.findFirst({
        where: { id: normalizedPriorityId, projectId },
      });
      if (!priority) {
        throw new ApiError("Priority not found or does not belong to this project", HTTP_STATUS.NOT_FOUND);
      }
    }

    // If projectId is provided, validate project access
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true } } },
      });

      if (!project) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Only project owner can create project tasks.
      const isOwner = project.ownerId === userId;
      if (!isOwner) {
        throw new ApiError(
          "Only project owner can create tasks",
          HTTP_STATUS.FORBIDDEN
        );
      }

      if (assigneeId) {
        const isMember =
          assigneeId === project.ownerId ||
          project.members.some((member) => member.userId === assigneeId);
        if (!isMember) {
          throw new ApiError(
            "Assignee must be a member of the project",
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        isCompleted: isCompleted ?? false,
        statusId: normalizedStatusId,
        priorityId: normalizedPriorityId,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        creatorId: userId,
        assigneeId: assigneeId || null,
      },
      include: {
        status: true,
        priority: true,
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true, pushToken: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
        },
        attachments: true,
      },
    });

    if (task.project?.id && task.assignee) {
      void sendTaskAssignmentAlerts({
        task,
        assignedByUserId: userId,
      }).catch((error) => {
        console.error("Failed to queue task assignment alerts:", error);
      });
    }

    return task;
  },

  getAll: async (userId, filters = {}) => {
    const { statusId, priorityId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
      ],
      ...(statusId && { statusId }),
      ...(priorityId && { priorityId }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ createdAt: "desc" }],
        include: {
          status: true,
          priority: true,
          assignee: {
            select: { id: true, name: true, email: true, profileImage: true },
          },
          project: {
            select: { id: true, title: true, ownerId: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getById: async (taskId, userId) => {
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
      include: {
        status: true,
        priority: true,
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true, pushToken: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
        },
        attachments: {
          include: {
            uploader: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return task;
  },

  update: async (taskId, userId, updateData) => {
    const existingTask = await prisma.task.findFirst({
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
      include: {
        project: { select: { id: true, ownerId: true, members: { select: { userId: true } } } },
      },
    });

    if (!existingTask) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const isCreator = existingTask.creatorId === userId;
    const isOwner = existingTask.project?.ownerId === userId;
    const isAssignee = existingTask.assigneeId === userId;
    const isProjectTask = Boolean(existingTask.projectId);

    if (isProjectTask && !isOwner) {
      throw new ApiError(
        "Project members can only view tasks",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (!isCreator && !isOwner && !isAssignee) {
      throw new ApiError(
        "Only the task creator, project owner, or assignee can update this task",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const {
      title,
      description,
      isCompleted,
      statusId,
      priorityId,
      dueDate,
      assigneeId,
    } = updateData;

    const data = {};

    // Completion can only be toggled by task creator, assignee, or project owner.
    if (isCompleted !== undefined && !isCreator && !isAssignee && !isOwner) {
      throw new ApiError(
        "Only the task creator, assignee, or project owner can update completion status",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (isCreator || isOwner) {
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (isCompleted !== undefined && (isCreator || isAssignee || isOwner)) {
        data.isCompleted = isCompleted;
      }

      if (statusId !== undefined) {
        if (statusId === null || statusId === "") {
          data.statusId = null;
        } else {
          const status = await prisma.status.findFirst({
            where: { id: statusId, projectId: existingTask.projectId },
          });
          if (!status) {
            throw new ApiError("Status not found", HTTP_STATUS.NOT_FOUND);
          }
          data.statusId = statusId;
        }
      }

      if (priorityId !== undefined) {
        if (priorityId === null || priorityId === "") {
          data.priorityId = null;
        } else {
          const priority = await prisma.priority.findFirst({
            where: { id: priorityId, projectId: existingTask.projectId },
          });
          if (!priority) {
            throw new ApiError("Priority not found", HTTP_STATUS.NOT_FOUND);
          }
          data.priorityId = priorityId;
        }
      }

      if (dueDate !== undefined) {
        if (dueDate) {
          const parsedDueDate = new Date(dueDate);
          if (parsedDueDate < new Date()) {
            throw new ApiError("Due date cannot be in the past", HTTP_STATUS.BAD_REQUEST);
          }
          data.dueDate = parsedDueDate;
        } else {
          data.dueDate = null;
        }
      }

      if (assigneeId !== undefined && existingTask.project) {
        if (assigneeId === null) {
          data.assigneeId = null;
        } else {
          const isMember =
            assigneeId === existingTask.project.ownerId ||
            existingTask.project.members.some((member) => member.userId === assigneeId);
          if (!isMember) {
            throw new ApiError(
              "Assignee must be a member of the project",
              HTTP_STATUS.BAD_REQUEST
            );
          }
          data.assigneeId = assigneeId;
        }
      }
    } else if (isAssignee) {
      if (title !== undefined) data.title = title;
      if (isCompleted !== undefined) data.isCompleted = isCompleted;
      if (statusId !== undefined) {
        if (statusId === null || statusId === "") {
          data.statusId = null;
        } else {
          const status = await prisma.status.findFirst({
            where: { id: statusId, projectId: existingTask.projectId },
          });
          if (!status) {
            throw new ApiError("Status not found", HTTP_STATUS.NOT_FOUND);
          }
          data.statusId = statusId;
        }
      }
      // Assignees cannot change other fields
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        status: true,
        priority: true,
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true, pushToken: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
        },
      },
    });

    // Send notification if assignee was changed
    const assigneeChanged = assigneeId !== undefined && assigneeId !== existingTask.assigneeId;

    if (assigneeChanged && task.assignee) {
      const assigner = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await sendTaskAssignmentAlerts({
        task,
        assignedByName: assigner?.name,
      });
    } else if (assigneeChanged && !task.assignee) {
      console.log("[TaskAssignmentNotification] Skipped - assignee object missing", {
        taskId: task.id,
        previousAssigneeId: existingTask.assigneeId,
        requestedAssigneeId: assigneeId,
      });
    } else {
      console.log("[TaskAssignmentNotification] Skipped - assignee unchanged or not provided", {
        taskId: task.id,
        previousAssigneeId: existingTask.assigneeId,
        requestedAssigneeId: assigneeId,
      });
    }

    return task;
  },

  delete: async (taskId, userId) => {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingTask) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (existingTask.projectId) {
      if (existingTask.project?.ownerId !== userId) {
        throw new ApiError(
          "Only the project owner can delete project tasks",
          HTTP_STATUS.FORBIDDEN
        );
      }
    } else if (existingTask.creatorId !== userId) {
      throw new ApiError(
        "Only the task creator can delete standalone tasks",
        HTTP_STATUS.FORBIDDEN
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
  },

  getAllForProject: async (projectId, userId) => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!project) {
      throw new ApiError(
        "Access denied: Not a member of this project",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        status: true,
        priority: true,
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks;
  },
};