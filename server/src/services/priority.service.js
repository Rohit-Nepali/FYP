import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

const DEFAULT_STANDALONE_PRIORITIES = [
  { name: "Low", color: "#10B981", order: 0 },
  { name: "Medium", color: "#F59E0B", order: 1 },
  { name: "High", color: "#EF4444", order: 2 },
];

const buildStandalonePriorityData = (userId) =>
  DEFAULT_STANDALONE_PRIORITIES.map((priority) => ({
    ...priority,
    projectId: null,
    userId,
  }));

export const priorityService = {
  create: async (priorityData, projectId, userId) => {
    const { name, color, order } = priorityData;

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
        throw new ApiError("Only project owner can create priorities", HTTP_STATUS.FORBIDDEN);
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
          userId: null,
        },
      });

      return priority;
    }

    if (!userId) {
      throw new ApiError("User is required", HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await prisma.priority.findFirst({
      where: {
        projectId: null,
        userId,
        name: name.trim(),
      },
    });

    if (existing) {
      throw new ApiError("Priority with this name already exists", HTTP_STATUS.BAD_REQUEST);
    }

    const priority = await prisma.priority.create({
      data: {
        name: name.trim(),
        color: color || null,
        order: order || 0,
        projectId: null,
        userId,
      },
    });

    return priority;
  },

  getAll: async (projectId, userId) => {
    // If projectId is provided, check project access and get project priorities
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

      const priorities = await prisma.priority.findMany({
        where: { projectId, userId: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });

      return priorities;
    }

    // Get user's standalone priorities (no projectId)
    await priorityService.ensureStandaloneDefaultsForUser(userId);

    const priorities = await prisma.priority.findMany({
      where: { projectId: null, userId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return priorities;
  },

  ensureStandaloneDefaultsForUser: async (userId) => {
    const existing = await prisma.priority.findFirst({
      where: {
        projectId: null,
        userId,
      },
      select: { id: true },
    });

    if (existing) {
      return;
    }

    await prisma.priority.createMany({
      data: buildStandalonePriorityData(userId),
    });
  },

  getGlobal: async (userId) => {
    // Get user's standalone priorities (no projectId)
    await priorityService.ensureStandaloneDefaultsForUser(userId);

    const priorities = await prisma.priority.findMany({
      where: { projectId: null, userId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return priorities;
  },

  getById: async (priorityId, projectId, userId) => {
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
    }

    // Get global priority
    const priority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        projectId: null,
        userId,
      },
    });

    if (!priority) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return priority;
  },

  update: async (priorityId, projectId, userId, updateData) => {
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
        throw new ApiError("Only project owner can update priorities", HTTP_STATUS.FORBIDDEN);
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
    }

    // Update global priority
    const existingPriority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
        projectId: null,
        userId,
      },
    });

    if (!existingPriority) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const { name, color, order } = updateData;

    // Check for duplicate name among global priorities
    if (name && name.trim() !== existingPriority.name) {
      const duplicate = await prisma.priority.findFirst({
        where: {
          name: name.trim(),
          projectId: null,
            userId,
          id: { not: priorityId },
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

  delete: async (priorityId, projectId, userId) => {
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
        throw new ApiError("Only project owner can delete priorities", HTTP_STATUS.FORBIDDEN);
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

      return;
    }

    // Delete global priority
    const priority = await prisma.priority.findFirst({
      where: {
        id: priorityId,
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
