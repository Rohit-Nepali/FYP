// import {
//     ApiResponse,
//     ApiError,
//     SUCCESS_MESSAGES,
// } from "../utils/response.utils.js";
import { projectService } from "../services/project.service.js";
import { attachmentService } from "../services/attachment.service.js";
import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "#utils/response.utils.js";

export const createProjectController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const projectData = req.body;

        const project = await projectService.create(projectData, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.CREATED,
            SUCCESS_MESSAGES.CREATED,
            project
        );
    } catch (error) {
        next(error);
    }
};

export const getAllProjectsController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const projects = await projectService.getAll(userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            projects
        );
    } catch (error) {
        next(error);
    }
};

export const getProjectByIdController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const project = await projectService.getById(id, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            project
        );
    } catch (error) {
        next(error);
    }
};

export const updateProjectController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updateData = req.body;

        const project = await projectService.update(id, userId, updateData);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED,
            project
        );
    } catch (error) {
        next(error);
    }
};

export const deleteProjectController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await projectService.delete(id, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.DELETED
        );
    } catch (error) {
        next(error);
    }
};

export const addProjectMemberController = async (req, res, next) => {
    try {

        console.log("Adding members to project:", req.body);

        const userId = req.user.id;
        const { id } = req.params;
        const { memberId, userIds, role } = req.body;

        let project;

        if (userIds && Array.isArray(userIds)) {
             // Bulk add
             for (const mId of userIds) {
                 try {
                     await projectService.addMember(id, userId, mId, role);
                 } catch (err) {
                     // specific error handling if needed, e.g. ignoring 'already member'
                     // For now we continue to try adding others
                     console.log(`Failed to add member ${mId}: ${err.message}`);
                 }
             }
             // Get final state
             project = await projectService.getById(id, userId);
        } else if (memberId) {
             project = await projectService.addMember(id, userId, memberId, role);
        } else {
            // Fallback or error
            // If neither, maybe return current project or throw error
             project = await projectService.getById(id, userId);
        }

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            "Member(s) added successfully",
            project
        );
    } catch (error) {
        next(error);
    }
};

export const removeProjectMemberController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id, memberId } = req.params;

        const project = await projectService.removeMember(id, userId, memberId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            "Member removed successfully",
            project
        );
    } catch (error) {
        next(error);
    }
};

export const createProjectInviteController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // projectId
    const { email, role } = req.body;

    console.log("From userId " + userId + " to email " + email + "on project " + id);

    const result = await projectService.createInvite(id, userId, email, role);

    // If result has members, it means user existed and was added
    if (result.members) {
      return ApiResponse.sendSuccessResponse(
        res,
        HTTP_STATUS.OK,
        "Member added successfully",
        result
      );
    }

    // Otherwise, invite created
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

export const acceptProjectInviteController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.params;

    const project = await projectService.acceptInvite(token, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Invite accepted successfully",
      project
    );
  } catch (error) {
    next(error);
  }
};

export const getProjectInvitesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const invites = await projectService.getInvites(id, userId);

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

export const getProjectAttachmentsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // projectId

    const attachments = await attachmentService.getByProject(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Attachments retrieved successfully",
      attachments
    );
  } catch (error) {
    next(error);
  }
};

export const createProjectAttachmentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // projectId
    const file = req.file;

    if (!file) {
      throw new ApiError("No file uploaded", HTTP_STATUS.BAD_REQUEST);
    }

    const attachment = await attachmentService.createProjectAttachment({
      file,
      projectId: id,
      userId,
    });

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      "Attachment uploaded successfully",
      attachment
    );
  } catch (error) {
    next(error);
  }
};

export const deleteProjectAttachmentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id, attachmentId } = req.params; // projectId, attachmentId

    await attachmentService.delete(attachmentId, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Attachment deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};
