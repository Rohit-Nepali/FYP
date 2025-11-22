import {
  ApiResponse,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../utils/response.utils.js";
import { groupService } from "../services/group.service.js";

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

    const group = await groupService.addMember(id, userId, memberId, role);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Member added successfully",
      group
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
