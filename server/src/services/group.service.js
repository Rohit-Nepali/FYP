import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/response.utils.js";
import crypto from "crypto";

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

  /**
   * Create an invite for a user to join the group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (inviter, must be admin)
   * @param {string} email - Email to invite
   * @param {string} role - Role (default: member)
   * @returns {Promise<Object>} Invite object
   */
  createInvite: async (groupId, userId, email, role = "member") => {
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
        "Only group admins can create invites",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      // If user exists, add them directly
      return await this.addMember(groupId, userId, existingUser.id, role);
    }

    // Check if invite already exists
    const existingInvite = await prisma.groupInvite.findFirst({
      where: {
        groupId: groupId,
        email: email,
      },
    });

    if (existingInvite) {
      throw new ApiError(
        "An invite for this email already exists",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Create invite (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.groupInvite.create({
      data: {
        email: email,
        groupId: groupId,
        role: role,
        token: token,
        invitedById: userId,
        expiresAt: expiresAt,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return invite;
  },

  /**
   * Accept an invite
   * @param {string} token - Invite token
   * @param {string} userId - User ID accepting the invite
   * @returns {Promise<Object>} Updated group
   */
  acceptInvite: async (token, userId) => {
    const invite = await prisma.groupInvite.findUnique({
      where: { token: token },
      include: {
        group: true,
      },
    });

    if (!invite) {
      throw new ApiError("Invalid invite token", HTTP_STATUS.NOT_FOUND);
    }

    if (invite.expiresAt < new Date()) {
      throw new ApiError("Invite has expired", HTTP_STATUS.BAD_REQUEST);
    }

    // Check if user email matches invite email
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.email !== invite.email) {
      throw new ApiError(
        "This invite is not for your email address",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Add user to group
    await this.addMember(
      invite.groupId,
      invite.invitedById,
      userId,
      invite.role
    );

    // Delete the invite
    await prisma.groupInvite.delete({
      where: { id: invite.id },
    });

    // Return updated group
    return await this.getById(invite.groupId, userId);
  },

  /**
   * Get invites for a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (must be admin)
   * @returns {Promise<Array>} Invites
   */
  getInvites: async (groupId, userId) => {
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
        "Only group admins can view invites",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const invites = await prisma.groupInvite.findMany({
      where: { groupId: groupId },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invites;
  },
};
