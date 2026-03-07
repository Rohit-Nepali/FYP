import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";
import { sendPushNotification } from "./notification.service.js";

export const taskService = {
  create: async (taskData, userId) => {
    const { title, description, statusId, priorityId, dueDate, projectId, assigneeId } = taskData;

    // Default status and priority logic
    let finalStatusId = statusId;
    let finalPriorityId = priorityId;

    if (!finalStatusId) {
      // Get first status for project (should be "To Do" by default)
      const defaultStatus = await prisma.status.findFirst({
        where: { projectId },
        orderBy: { order: "asc" },
      });
      if (!defaultStatus) {
        throw new ApiError("No status found for this project", HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      finalStatusId = defaultStatus.id;
    } else {
      // Verify status belongs to project
      const status = await prisma.status.findFirst({
        where: { id: finalStatusId, projectId },
      });
      if (!status) {
        throw new ApiError("Status not found or does not belong to this project", HTTP_STATUS.NOT_FOUND);
      }
    }

    if (!finalPriorityId) {
      // Get first priority for project (should be "Low" by default)
      const defaultPriority = await prisma.priority.findFirst({
        where: { projectId },
        orderBy: { order: "asc" },
      });
      if (!defaultPriority) {
        throw new ApiError("No priority found for this project", HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      finalPriorityId = defaultPriority.id;
    } else {
      // Verify priority belongs to project
      const priority = await prisma.priority.findFirst({
        where: { id: finalPriorityId, projectId },
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

      // Check if user is owner or member
      const isOwner = project.ownerId === userId;
      const isMember = project.members.some((member) => member.userId === userId);

      if (!isOwner && !isMember) {
        throw new ApiError(
          "Only project owner or members can create tasks",
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
        statusId: finalStatusId,
        priorityId: finalPriorityId,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        creatorId: userId,
        assigneeId: assigneeId || null,
      },
      include: {
        status: true,
        priority: true,
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
        },
        attachments: true,
      },
    });

    return task;
  },

  getAll: async (userId, filters = {}) => {
    const { statusId, priorityId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Get tasks created by user or tasks in projects where user is a member
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);

    const where = {
      OR: [
        { creatorId: userId },
        ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
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
          select: { id: true, name: true, email: true, profileImage: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
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

    if (!isCreator && !isOwner && !isAssignee) {
      throw new ApiError(
        "Only the task creator, project owner, or assignee can update this task",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const {
      title,
      description,
      statusId,
      priorityId,
      dueDate,
      assigneeId,
    } = updateData;

    const data = {};

    if (isCreator || isOwner) {
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;

      if (statusId !== undefined) {
        // Verify status belongs to project
        const status = await prisma.status.findFirst({
          where: { id: statusId, projectId: existingTask.projectId },
        });
        if (!status) {
          throw new ApiError("Status not found", HTTP_STATUS.NOT_FOUND);
        }
        data.statusId = statusId;
      }

      if (priorityId !== undefined) {
        // Verify priority belongs to project
        const priority = await prisma.priority.findFirst({
          where: { id: priorityId, projectId: existingTask.projectId },
        });
        if (!priority) {
          throw new ApiError("Priority not found", HTTP_STATUS.NOT_FOUND);
        }
        data.priorityId = priorityId;
      }

      if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

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
      if (statusId !== undefined) {
        // Verify status belongs to project
        const status = await prisma.status.findFirst({
          where: { id: statusId, projectId: existingTask.projectId },
        });
        if (!status) {
          throw new ApiError("Status not found", HTTP_STATUS.NOT_FOUND);
        }
        data.statusId = statusId;
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
          select: { id: true, name: true, email: true, profileImage: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
        },
      },
    });

    // Send notification if assignee was changed
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId && task.assignee && task.assignee.pushToken) {
      try {
        await sendPushNotification(
          task.assignee.pushToken,
          "Task Assigned",
          `You have been assigned to task: ${task.title}`,
          { taskId: task.id, type: "task_assigned" }
        );
      } catch (error) {
        console.error("Failed to send assignment notification:", error);
      }
    }

    return task;
  },

  delete: async (taskId, userId) => {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: userId },
          {
            project: {
              ownerId: userId,
            },
          },
        ],
      },
    });

    if (!existingTask) {
      throw new ApiError(
        "Only the task creator or project owner can delete this task",
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