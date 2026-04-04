import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

const DEFAULT_STANDALONE_STATUSES = [
  { name: "To Do", color: "#6B7280", order: 0 },
  { name: "In Progress", color: "#3B82F6", order: 1 },
  { name: "Done", color: "#10B981", order: 2 },
];

const buildStandaloneStatusData = (userId) =>
  DEFAULT_STANDALONE_STATUSES.map((status) => ({
    ...status,
    projectId: null,
    userId,
  }));

export const statusService = {
  create: async (statusData, projectId, userId) => {
    const { name, color, order } = statusData;

    // If projectId is provided, check project access (owner only)
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true } } },
      });

      if (!project) {
        throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
      }

      if (project.ownerId !== userId) {
        throw new ApiError("Only project owner can create statuses", HTTP_STATUS.FORBIDDEN);
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

      const status = await prisma.status.create({
        data: {
          name: name.trim(),
          color: color || null,
          order: order || 0,
          projectId,
          userId: null,
        },
      });

      return status;
    }

    if (!userId) {
      throw new ApiError("User is required", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await prisma.status.findFirst({
      where: {
        projectId: null,
        userId,
        name: name.trim(),
      },
    });

    if (existing) {
      throw new ApiError("Status with this name already exists", HTTP_STATUS.BAD_REQUEST);
    }

    const status = await prisma.status.create({
      data: {
        name: name.trim(),
        color: color || null,
        order: order || 0,
        projectId: null,
        userId,
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
        where: { projectId, userId: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });

      return statuses;
    }

    // Get user's standalone statuses (no projectId)
    await statusService.ensureStandaloneDefaultsForUser(userId);

    const statuses = await prisma.status.findMany({
      where: { projectId: null, userId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return statuses;
  },

  ensureStandaloneDefaultsForUser: async (userId) => {
    const existing = await prisma.status.findFirst({
      where: {
        projectId: null,
        userId,
      },
      select: { id: true },
    });

    if (existing) {
      return;
    }

    await prisma.status.createMany({
      data: buildStandaloneStatusData(userId),
    });
  },

  getGlobal: async (userId) => {
    // Get user's standalone statuses (no projectId)
    await statusService.ensureStandaloneDefaultsForUser(userId);

    const statuses = await prisma.status.findMany({
      where: { projectId: null, userId },
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
        userId,
      },
    });

    if (!status) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return status;
  },

  update: async (statusId, projectId, userId, updateData) => {
    // If projectId is provided, check project access (owner only)
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true } } },
      });

      if (!project) {
        throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
      }

      if (project.ownerId !== userId) {
        throw new ApiError("Only project owner can update statuses", HTTP_STATUS.FORBIDDEN);
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
        userId,
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
            userId,
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
    // If projectId is provided, check project access (owner only)
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true } } },
      });

      if (!project) {
        throw new ApiError("Project not found", HTTP_STATUS.NOT_FOUND);
      }

      if (project.ownerId !== userId) {
        throw new ApiError("Only project owner can delete statuses", HTTP_STATUS.FORBIDDEN);
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
