import { prisma } from "#config/db.js";

/**
 * Log an activity for a project
 * @param {Object} data - Activity data
 * @param {string} data.type - Activity type (TASK_CREATED, TASK_UPDATED, COMMENT_ADDED)
 * @param {string} data.projectId - Project ID
 * @param {string} data.userId - User ID who performed the action
 * @param {string} [data.taskId] - Task ID (optional)
 * @param {string} [data.commentId] - Comment ID (optional)
 * @param {Object} [data.metadata] - Additional metadata
 * @returns {Promise<Object>} Created activity
 */
export const logActivity = async (data) => {
  const { type, projectId, userId, taskId, commentId, metadata } = data;

  return await prisma.activity.create({
    data: {
      type,
      projectId,
      userId,
      taskId,
      commentId,
      metadata,
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
      task: {
        select: {
          id: true,
          title: true,
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
        },
      },
    },
  });
};

/**
 * Get activities for a project with pagination
 * @param {string} projectId - Project ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise<Object>} Activities with pagination info
 */
export const getProjectActivities = async (projectId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: {
        projectId,
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
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.activity.count({
      where: {
        projectId,
      },
    }),
  ]);

  return {
    data: activities,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + activities.length < total,
    },
  };
};
