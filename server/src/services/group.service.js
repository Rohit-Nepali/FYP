import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";

export const groupService = {
  /**
   * Create a new group
   * @param {Object} groupData - Group data
   * @param {string} groupData.name - Group name
   * @param {string} groupData.description - Group description (optional)
   * @param {string} userId - User ID (creator)
   * @returns {Promise<Object>} Created group
   */
  create: async (groupData, userId) => {
    const { name, description } = groupData;

    const group = await prisma.group.create({
      data: {
        name,
        description,
        createdById: userId,
        members: {
          create: {
            userId: userId,
            role: "admin",
          },
        },
      },
      include: {
        members: {
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
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return group;
  },

  /**
   * Get all groups for a user (owned or member)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Groups
   */
  getAll: async (userId) => {
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        members: {
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
        },
        createdBy: {
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

    return groups;
  },

  /**
   * Get a group by ID
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (to check membership)
   * @returns {Promise<Object>} Group
   */
  getById: async (groupId, userId) => {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        members: {
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
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!group) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return group;
  },

  /**
   * Update a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (must be admin/owner)
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated group
   */
  update: async (groupId, userId, updateData) => {
    // Check if user is admin/owner
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
        role: "admin",
      },
    });

    if (!membership) {
      throw new ApiError(
        "Only group admins can update the group",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const { name, description } = updateData;

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        members: {
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
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return group;
  },

  /**
   * Delete a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (must be owner)
   * @returns {Promise<void>}
   */
  delete: async (groupId, userId) => {
    // Check if user is owner
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        createdById: userId,
      },
    });

    if (!group) {
      throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.group.delete({
      where: { id: groupId },
    });
  },

  /**
   * Add a member to group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (admin)
   * @param {string} memberId - Member to add
   * @param {string} role - Role (default: member)
   * @returns {Promise<Object>} Updated group
   */
  addMember: async (groupId, userId, memberId, role = "member") => {
    // Check if user is admin
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
        role: "admin",
      },
    });

    if (!membership) {
      throw new ApiError(
        "Only group admins can add members",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Check if member already exists
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: memberId,
        },
      },
    });

    if (existingMember) {
      throw new ApiError(
        "User is already a member of this group",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.groupMember.create({
      data: {
        groupId: groupId,
        userId: memberId,
        role: role,
      },
    });

    // Return updated group
    return await this.getById(groupId, userId);
  },

  /**
   * Remove a member from group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (admin)
   * @param {string} memberId - Member to remove
   * @returns {Promise<Object>} Updated group
   */
  removeMember: async (groupId, userId, memberId) => {
    // Check if user is admin
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
        role: "admin",
      },
    });

    if (!membership) {
      throw new ApiError(
        "Only group admins can remove members",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Cannot remove owner
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (group.createdById === memberId) {
      throw new ApiError(
        "Cannot remove the group owner",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: memberId,
        },
      },
    });

    // Return updated group
    return await this.getById(groupId, userId);
  },
};
