import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const statusService = {
  create: async (statusData, userId) => {
    const { name, color, order } = statusData;

    // Check if status with same name already exists for this user
    const existing = await prisma.status.findUnique({
      where: {
        userId_name: {
          userId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      throw new ApiError(
        "Status with this name already exists",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const status = await prisma.status.create({
      data: {
        name: name.trim(),
        color: color || null,
        order: order || 0,
        userId,
      },
    });

    return status;
  },

  getAll: async (userId) => {
    const statuses = await prisma.status.findMany({
      where: { userId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return statuses;
  },

  getById: async (statusId, userId) => {
    const status = await prisma.status.findFirst({
      where: {
        id: statusId,
        userId,
      },
    });

    if (!status) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return status;
  },

  update: async (statusId, userId, updateData) => {
    const existingStatus = await prisma.status.findFirst({
      where: {
        id: statusId,
        userId,
      },
    });

    if (!existingStatus) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const { name, color, order } = updateData;

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existingStatus.name) {
      const duplicate = await prisma.status.findUnique({
        where: {
          userId_name: {
            userId,
            name: name.trim(),
          },
        },
      });

      if (duplicate) {
        throw new ApiError(
          "Status with this name already exists",
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (color !== undefined) data.color = color || null;
    if (order !== undefined) data.order = order;

    const status = await prisma.status.update({
      where: { id: statusId },
      data,
    });

    return status;
  },

  delete: async (statusId, userId) => {
    const status = await prisma.status.findFirst({
      where: {
        id: statusId,
        userId,
      },
      include: {
        tasks: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!status) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if status is being used by any tasks
    if (status.tasks.length > 0) {
      throw new ApiError(
        "Cannot delete status that is being used by tasks",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.status.delete({
      where: { id: statusId },
    });
  },
};
