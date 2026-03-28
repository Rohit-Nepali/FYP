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

    const project = await projectService.delete(id, userId);

    // Log activity (this will be deleted along with project, but logged for audit)
    await logActivity({
      type: 'PROJECT_DELETED',
      projectId: project.id,
      userId,
      metadata: { projectTitle: project.title }
    });

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
    const userId = req.user.id;
    const { id } = req.params;
    const { memberId, userIds, role } = req.body;

    let project;
    let invitedMembers = [];

    if (userIds && Array.isArray(userIds)) {
      // Bulk invite
      for (const mId of userIds) {
        try {
          const targetUser = await prisma.user.findUnique({
            where: { id: mId },
            select: { id: true, email: true },
          });

          if (!targetUser) {
            continue;
          }

          await projectService.createInvite(id, userId, targetUser.email, role);
          invitedMembers.push(mId);
        } catch (err) {
          console.log(`Failed to invite member ${mId}: ${err.message}`);
        }
      }
      project = await projectService.getById(id, userId);
    } else if (memberId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, email: true },
      });

      if (!targetUser) {
        throw new ApiError("User not found", HTTP_STATUS.NOT_FOUND);
      }

      await projectService.createInvite(id, userId, targetUser.email, role);
      invitedMembers.push(memberId);
      project = await projectService.getById(id, userId);
    } else {
      throw new ApiError("memberId or userIds is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Log activity for each invited member
    for (const invitedMemberId of invitedMembers) {
      await logActivity({
        type: 'MEMBER_INVITED',
        projectId: id,
        userId,
        metadata: { memberId: invitedMemberId, role: role || 'member' }
      });
    }

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Invitation(s) sent successfully",
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

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      "Invitation sent successfully",
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

export const declineProjectInviteController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.params;

    const result = await projectService.declineInvite(token, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Invite declined successfully",
      result
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

    console.log("File :", file);
    console.log("REq body: ", req.body);

    if (!file) {
      throw new ApiError("No file uploaded", HTTP_STATUS.BAD_REQUEST);
    }

    // Verify user has access to the project
    const project = await projectService.getById(id, userId);
    if (!project) {
      throw new ApiError("Project not found or you don't have access", HTTP_STATUS.FORBIDDEN);
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

    // Verify user has access to the project
    const project = await projectService.getById(id, userId);
    if (!project) {
      throw new ApiError("Project not found or you don't have access", HTTP_STATUS.FORBIDDEN);
    }

    // Get attachment details before deletion for activity logging
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, fileName: true, taskId: true, projectId: true }
    });

    if (!attachment) {
      throw new ApiError("Attachment not found", HTTP_STATUS.NOT_FOUND);
    }

    // Verify attachment belongs to this project
    if (attachment.projectId !== id) {
      throw new ApiError("Attachment does not belong to this project", HTTP_STATUS.FORBIDDEN);
    }

    await attachmentService.delete(attachmentId, userId);

    // Log activity
    await logActivity({
      type: 'ATTACHMENT_DELETED',
      projectId: id,
      userId,
      taskId: attachment.taskId || undefined,
      metadata: { fileName: attachment.fileName, attachmentId: attachment.id }
    });

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

export const getProjectAssignmentReportController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const report = await projectService.getAssignmentReport(id, userId);

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      "Assignment report retrieved successfully",
      report
    );
  } catch (error) {
    next(error);
  }
};