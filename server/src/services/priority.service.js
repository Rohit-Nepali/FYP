import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const priorityService = {
  create: async (priorityData, projectId, userId) => {
    const { name, color, order } = priorityData;

    // Check if user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });

    if (!project) {
      throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
    }

    if (project.ownerId !== userId && !project.members.some(member => member.userId === userId)) {
      throw new ApiError("Access denied", HTTP_STATUS.FORBIDDEN);
    }

    // Check if priority with same name already exists for this project
    const existing = await prisma.priority.findUnique({
      where: {
        projectId_name: {
          projectId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      throw new ApiError(
        "Priority with this name already exists in this project",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const priority = await prisma.priority.create({
      data: {
        name: name.trim(),
        color: color || null,
        order: order || 0,
        projectId,
      },
    });

    return priority;
  },

  getAll: async (projectId, userId) => {
    // Check if user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });

    if (!project) {
      throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
    }

    if (project.ownerId !== userId && !project.members.some(member => member.userId === userId)) {
      throw new ApiError("Access denied", HTTP_STATUS.FORBIDDEN);
    }

    const priorities = await prisma.priority.findMany({
      where: { projectId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return priorities;
  },

  getById: async (priorityId, projectId, userId) => {
    // Check if user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });

    if (!project) {
      throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
    }

    if (project.ownerId !== userId && !project.members.some(member => member.userId === userId)) {
      throw new ApiError("Access denied", HTTP_STATUS.FORBIDDEN);
    }

    const priority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        projectId,
      },
    });

    if (!priority) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return priority;
  },

  update: async (priorityId, projectId, userId, updateData) => {
    // Check if user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });

    if (!project) {
      throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
    }

    if (project.ownerId !== userId && !project.members.some(member => member.userId === userId)) {
      throw new ApiError("Access denied", HTTP_STATUS.FORBIDDEN);
    }

    const existingPriority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        projectId,
      },
    });

    if (!existingPriority) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const { name, color, order } = updateData;

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existingPriority.name) {
      const duplicate = await prisma.priority.findUnique({
        where: {
          projectId_name: {
            projectId,
            name: name.trim(),
          },
        },
      });

      if (duplicate) {
        throw new ApiError(
          "Priority with this name already exists in this project",
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (color !== undefined) data.color = color || null;
    if (order !== undefined) data.order = order;

    const priority = await prisma.priority.update({
      where: { id: priorityId },
      data,
    });

    return priority;
  },

  delete: async (priorityId, projectId, userId) => {
    // Check if user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });

    if (!project) {
      throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
    }

    if (project.ownerId !== userId && !project.members.some(member => member.userId === userId)) {
      throw new ApiError("Access denied", HTTP_STATUS.FORBIDDEN);
    }

    const priority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        projectId,
      },
      include: {
        tasks: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!priority) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if priority is being used by any tasks
    if (priority.tasks.length > 0) {
      throw new ApiError(
        "Cannot delete priority that is being used by tasks",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.priority.delete({
      where: { id: priorityId },
    });
  },
};
