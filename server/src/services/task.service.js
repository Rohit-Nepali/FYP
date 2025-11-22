import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const taskService = {
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description (optional)
   * @param {string} taskData.status - Task status
   * @param {string} taskData.priority - Task priority
   * @param {Date} taskData.dueDate - Task due date (optional)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created task
   */
  create: async (taskData, userId) => {
    const { title, description, status, priority, dueDate } = taskData;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return task;
  },

  /**
   * Get all tasks for a user with optional filters
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Filter by status
   * @param {string} filters.priority - Filter by priority
   * @param {number} filters.page - Page number
   * @param {number} filters.limit - Items per page
   * @returns {Promise<Object>} Tasks with pagination
   */
  getAll: async (userId, filters = {}) => {
    const { status, priority, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
    };

    console.log("where : ", where);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
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

  /**
   * Get a task by ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Task
   */
  getById: async (taskId, userId) => {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!task) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return task;
  },

  /**
   * Update a task
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task
   */
  update: async (taskId, userId, updateData) => {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const { title, description, status, priority, dueDate } = updateData;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return task;
  },

  /**
   * Delete a task
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  delete: async (taskId, userId) => {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
  },

  /**
   * Get all tasks for a group (all members' tasks)
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (to check membership)
   * @returns {Promise<Array>} Tasks
   */
  getAllForGroup: async (groupId, userId) => {
    // Check if user is member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership) {
      throw new ApiError(
        "Access denied: Not a member of this group",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Get all user IDs in the group
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    const userIds = groupMembers.map((member) => member.userId);

    const tasks = await prisma.task.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      include: {
        user: {
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

    return tasks;
  },
};
