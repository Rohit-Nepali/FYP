import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const priorityService = {
  create: async (priorityData, userId) => {
    const { name, color, order } = priorityData;

    // Check if priority with same name already exists for this user
    const existing = await prisma.priority.findUnique({
      where: {
        userId_name: {
          userId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      throw new ApiError(
        "Priority with this name already exists",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const priority = await prisma.priority.create({
      data: {
        name: name.trim(),
        color: color || null,
        order: order || 0,
        userId,
      },
    });

    return priority;
  },

  getAll: async (userId) => {
    const priorities = await prisma.priority.findMany({
      where: { userId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return priorities;
  },

  getById: async (priorityId, userId) => {
    const priority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        userId,
      },
    });

    if (!priority) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return priority;
  },

  update: async (priorityId, userId, updateData) => {
    const existingPriority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        userId,
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
          userId_name: {
            userId,
            name: name.trim(),
          },
        },
      });

      if (duplicate) {
        throw new ApiError(
          "Priority with this name already exists",
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

  delete: async (priorityId, userId) => {
    const priority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        userId,
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
