import {
  ApiResponse,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../utils/response.utils.js";
import { groupService } from "../services/group.service.js";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";

export const createGroupController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupData = req.body;
    console.log("Group data", groupData);

    const group = await groupService.create(groupData, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.CREATED,
      group
    );
  } catch (error) {
    next(error);
  }
};

export const getAllGroupsController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const groups = await groupService.getAll(userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      groups
    );
  } catch (error) {
    next(error);
  }
};

export const getGroupByIdController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const group = await groupService.getById(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      group
    );
  } catch (error) {
    next(error);
  }
};

export const updateGroupController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const group = await groupService.update(id, userId, updateData);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.UPDATED,
      group
    );
  } catch (error) {
    next(error);
  }
};

export const deleteGroupController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await groupService.delete(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.DELETED
    );
  } catch (error) {
    next(error);
  }
};

export const addMemberController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { memberId, role } = req.body;

    // Get user by memberId to get email
    const user = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!user) {
      throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    const result = await groupService.createInvite(
      id,
      userId,
      user.email,
      role
    );

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Member added successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

export const removeMemberController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id, memberId } = req.params;

    const group = await groupService.removeMember(id, userId, memberId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Member removed successfully",
      group
    );
  } catch (error) {
    next(error);
  }
};

export const createInviteController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { email, role } = req.body;

    const result = await groupService.createInvite(id, userId, email, role);

    // If it's a direct member addition (user exists)
    if (result.members) {
      return ApiResponse.sendSuccessResponse(
        res,
        HTTP_STATUS.OK,
        "Member added successfully",
        result
      );
    }

    // If it's an invite
    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      "Invite created successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

export const acceptInviteController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.params;

    const group = await groupService.acceptInvite(token, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Invite accepted successfully",
      group
    );
  } catch (error) {
    next(error);
  }
};

export const getInvitesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const invites = await groupService.getInvites(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Invites retrieved successfully",
      invites
    );
  } catch (error) {
    next(error);
  }
};
