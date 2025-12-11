import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const taskService = {
  create: async (taskData, userId) => {
    const { title, description, status, priority, dueDate, projectId, assigneeId } =
      taskData;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });

    if (!project) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (project.ownerId !== userId) {
      throw new ApiError(
        "Only the project owner can create tasks",
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

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
        },
      },
    });

    return task;
  },

  getAll: async (userId, filters = {}) => {
    const { status, priority, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

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
    if (projectIds.length === 0) {
      return {
        tasks: [],
        pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 },
      };
    }

    const where = {
      projectId: { in: projectIds },
      ...(status && { status }),
      ...(priority && { priority }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
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
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      include: {
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
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      include: {
        project: { select: { id: true, ownerId: true, members: { select: { userId: true } } } },
      },
    });

    if (!existingTask) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const isOwner = existingTask.project.ownerId === userId;
    const isAssignee = existingTask.assigneeId === userId;

    if (!isOwner && !isAssignee) {
      throw new ApiError(
        "Only the project owner or assignee can update this task",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
    } = updateData;

    const data = {};

    if (isOwner) {
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (status !== undefined) data.status = status;
      if (priority !== undefined) data.priority = priority;
      if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

      if (assigneeId !== undefined) {
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
      if (status !== undefined) data.status = status;
      // Assignees cannot change other fields
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
        project: {
          select: { id: true, title: true, ownerId: true },
        },
      },
    });

    return task;
  },

  delete: async (taskId, userId) => {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          ownerId: userId,
        },
      },
    });

    if (!existingTask) {
      throw new ApiError(
        "Only the project owner can delete this task",
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
        assignee: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks;
  },
};
