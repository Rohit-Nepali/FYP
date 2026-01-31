import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const statusService = {
  create: async (statusData, projectId, userId) => {
    const { name, color, order } = statusData;

    // If projectId is provided, check project access
    if (projectId) {
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

      // Check if status with same name already exists for this project
      const existing = await prisma.status.findUnique({
        where: {
          projectId_name: {
            projectId,
            name: name.trim(),
          },
        },
      });

      if (existing) {
        throw new ApiError(
          "Status with this name already exists in this project",
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    const status = await prisma.status.create({
      data: {
        name: name.trim(),
        color: color || null,
        order: order || 0,
        projectId: projectId || null,
      },
    });

    return status;
  },

  getAll: async (projectId, userId) => {
    // If projectId is provided, check project access and get project statuses
    if (projectId) {
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

      const statuses = await prisma.status.findMany({
        where: { projectId },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });

      return statuses;
    }

    // Get user's global statuses (no projectId)
    const statuses = await prisma.status.findMany({
      where: { projectId: null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return statuses;
  },

  getGlobal: async (userId) => {
    // Get user's global statuses (no projectId)
    const statuses = await prisma.status.findMany({
      where: { projectId: null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return statuses;
  },

  getById: async (statusId, projectId, userId) => {
    // If projectId is provided, check project access
    if (projectId) {
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

      const status = await prisma.status.findFirst({
        where: {
          id: statusId,
          projectId,
        },
      });

      if (!status) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      return status;
    }

    // Get global status
    const status = await prisma.status.findFirst({
      where: {
        id: statusId,
        projectId: null,
      },
    });

    if (!status) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return status;
  },

  update: async (statusId, projectId, userId, updateData) => {
    // If projectId is provided, check project access
    if (projectId) {
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

      const existingStatus = await prisma.status.findFirst({
        where: {
          id: statusId,
          projectId,
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
            projectId_name: {
              projectId,
              name: name.trim(),
            },
          },
        });

        if (duplicate) {
          throw new ApiError(
            "Status with this name already exists in this project",
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
    }

    // Update global status
    const existingStatus = await prisma.status.findFirst({
      where: {
        id: statusId,
        projectId: null,
      },
    });

    if (!existingStatus) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const { name, color, order } = updateData;

    // Check for duplicate name among global statuses
    if (name && name.trim() !== existingStatus.name) {
      const duplicate = await prisma.status.findFirst({
        where: {
          name: name.trim(),
          projectId: null,
          id: { not: statusId },
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

  delete: async (statusId, projectId, userId) => {
    // If projectId is provided, check project access
    if (projectId) {
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

      const status = await prisma.status.findFirst({
        where: {
          id: statusId,
          projectId,
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

      return;
    }

    // Delete global status
    const status = await prisma.status.findFirst({
      where: {
        id: statusId,
        projectId: null,
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
