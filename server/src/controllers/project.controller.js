import { projectService } from "../services/project.service.js";
import { attachmentService } from "../services/attachment.service.js";
import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "#utils/response.utils.js";
import { logActivity } from "../services/activity.service.js";
import { prisma } from "../config/db.js";
import { ApiError } from "#utils/error.utils.js";

export const createProjectController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const projectData = req.body;

        const project = await projectService.create(projectData, userId);

        // Log activity
        await logActivity({
            type: 'PROJECT_CREATED',
            projectId: project.id,
            userId,
            metadata: { projectTitle: project.title }
        });

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

        // Log activity
        await logActivity({
            type: 'PROJECT_UPDATED',
            projectId: project.id,
            userId,
            metadata: { projectTitle: project.title }
        });

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

        // Get project details before deletion for activity logging
        const { prisma } = require('../config/prisma.config');
        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true, title: true }
        });

        await projectService.delete(id, userId);

        // Log activity (this will be deleted along with project, but logged for audit)
        if (project) {
            await logActivity({
                type: 'PROJECT_DELETED',
                projectId: project.id,
                userId,
                metadata: { projectTitle: project.title }
            });
        }

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
        let addedMembers = [];

        if (userIds && Array.isArray(userIds)) {
             // Bulk add
             for (const mId of userIds) {
                 try {
                     await projectService.addMember(id, userId, mId, role);
                     addedMembers.push(mId);
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
             addedMembers.push(memberId);
        } else {
            // Fallback or error
            // If neither, maybe return current project or throw error
             project = await projectService.getById(id, userId);
        }

        // Log activity for each added member
        for (const addedMemberId of addedMembers) {
            await logActivity({
                type: 'MEMBER_ADDED',
                projectId: id,
                userId,
                metadata: { memberId: addedMemberId, role: role || 'member' }
            });
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

        // Log activity
        await logActivity({
            type: 'MEMBER_REMOVED',
            projectId: id,
            userId,
            metadata: { memberId }
        });

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

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!project) {
      return ApiResponse.sendErrorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        "You don't have access to this project"
      );
    }

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

    console.log("File :", file );
    console.log("REq body: ", req.body);

    if (!file) {
      throw new ApiError("No file uploaded", HTTP_STATUS.BAD_REQUEST);
    }

    const attachment = await attachmentService.createProjectAttachment({
      file,
      projectId: id,
      userId,
    });

    // Log activity
    await logActivity({
      type: 'ATTACHMENT_ADDED',
      projectId: id,
      userId,
      metadata: { fileName: attachment.fileName, attachmentId: attachment.id }
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

    // Get attachment details before deletion for activity logging
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, fileName: true, taskId: true }
    });

    await attachmentService.delete(attachmentId, userId);

    // Log activity
    if (attachment) {
      await logActivity({
        type: 'ATTACHMENT_DELETED',
        projectId: id,
        userId,
        taskId: attachment.taskId || undefined,
        metadata: { fileName: attachment.fileName, attachmentId: attachment.id }
      });
    }

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Attachment deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getProjectStatisticsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const statistics = await projectService.getStatistics(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Statistics retrieved successfully",
      statistics
    );
  } catch (error) {
    next(error);
  }
};