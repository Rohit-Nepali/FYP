import { projectService } from "../services/project.service.js";
import { attachmentService } from "../services/attachment.service.js";
import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "#utils/response.utils.js";
import { logActivity } from "../services/activity.service.js";
import { prisma } from "../config/db.js";
import { ApiError } from "#utils/error.utils.js";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInviteLandingPage = ({
  title,
  subtitle,
  inviteToken,
  deepLink,
  status = "valid",
}) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Taskora Invite</title>
    <style>
      :root {
        --bg-a: #0f172a;
        --bg-b: #1e293b;
        --card: #111827;
        --text: #e5e7eb;
        --muted: #9ca3af;
        --accent: #22c55e;
        --danger: #ef4444;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at top left, var(--bg-b), var(--bg-a));
        color: var(--text);
        font-family: Segoe UI, system-ui, sans-serif;
        padding: 24px;
      }
      .card {
        width: min(560px, 100%);
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
      }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0; color: var(--muted); line-height: 1.5; }
      .token {
        margin-top: 14px;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        word-break: break-all;
        font-size: 12px;
      }
      .actions {
        margin-top: 18px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .btn {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 14px;
        cursor: pointer;
      }
      .btn.primary { background: var(--accent); color: #04210f; font-weight: 700; }
      .btn.secondary { background: rgba(255,255,255,0.08); color: var(--text); }
      .status {
        margin-bottom: 10px;
        font-weight: 700;
        color: ${status === "valid" ? "var(--accent)" : "var(--danger)"};
      }
      .hint { margin-top: 12px; font-size: 13px; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="status">${status === "valid" ? "Invitation detected" : "Invitation unavailable"}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <div class="actions">
        <button class="btn primary" onclick="openApp()">Open in Taskora App</button>
        <button class="btn secondary" onclick="copyToken()">Copy Invite Token</button>
      </div>
      <div class="token" id="token">${escapeHtml(inviteToken)}</div>
      <p class="hint">If the app does not open, launch Taskora manually, sign in with the invited email, then use this invite token.</p>
    </main>

    <script>
      const deepLink = ${JSON.stringify(deepLink)};
      const token = ${JSON.stringify(inviteToken)};
      function openApp() {
        window.location.href = deepLink;
      }
      async function copyToken() {
        try {
          await navigator.clipboard.writeText(token);
          alert("Invite token copied.");
        } catch (_err) {
          alert("Could not copy token automatically.");
        }
      }
      ${status === "valid" ? "setTimeout(openApp, 300);" : ""}
    </script>
  </body>
</html>`;

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

export const getProjectInviteLandingController = async (req, res, next) => {
  try {
    const { token } = req.params;
    const scheme = (process.env.INVITE_APP_SCHEME || "Taskora").replace(/:\/\/?$/, "");
    const deepLink = `${scheme}://invite/${encodeURIComponent(token)}`;
    const invite = await projectService.getInviteByTokenPublic(token);

    if (!invite) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(
          renderInviteLandingPage({
            title: "Invite link not found",
            subtitle: "This invitation is invalid or has already been used.",
            inviteToken: token,
            deepLink,
            status: "invalid",
          })
        );
    }

    if (invite.expiresAt < new Date()) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(
          renderInviteLandingPage({
            title: "Invite link expired",
            subtitle: "Request a fresh invitation from the project owner.",
            inviteToken: token,
            deepLink,
            status: "expired",
          })
        );
    }

    return res.status(HTTP_STATUS.OK).send(
      renderInviteLandingPage({
        title: `You are invited to ${invite.project.title}`,
        subtitle: "Opening Taskora app now. If prompted, sign in to continue.",
        inviteToken: token,
        deepLink,
        status: "valid",
      })
    );
  } catch (error) {
    next(error);
  }
};