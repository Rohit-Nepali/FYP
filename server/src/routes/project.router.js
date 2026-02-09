import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
    acceptProjectInviteController,
    addProjectMemberController,
    createProjectController,
    createProjectAttachmentController,
    createProjectInviteController,
    deleteProjectAttachmentController,
    deleteProjectController,
    getAllProjectsController,
    getProjectAttachmentsController,
    getProjectByIdController,
    getProjectInvitesController,
    getProjectStatisticsController,
    removeProjectMemberController,
    updateProjectController,
} from "../controllers/project.controller.js";
import {
    addProjectMemberSchema,
    createProjectSchema,
    updateProjectSchema,
} from "../validator/project.validator.js";

const projectRouter = Router();

projectRouter.use(authenticateToken);

projectRouter.post("/", validate(createProjectSchema), createProjectController);
projectRouter.get("/", getAllProjectsController);
projectRouter.get("/:id/statistics", getProjectStatisticsController);
projectRouter.get("/:id", getProjectByIdController);
projectRouter.put("/:id", validate(updateProjectSchema), updateProjectController);
projectRouter.delete("/:id", deleteProjectController);

// Add Member to Project
projectRouter.post(
    "/:id/members",
    validate(addProjectMemberSchema),
    addProjectMemberController
);
projectRouter.delete("/:id/members/:memberId", removeProjectMemberController);

// Invite management routes
projectRouter.post("/:id/invites", createProjectInviteController);
projectRouter.get("/:id/invites", getProjectInvitesController);
projectRouter.post("/invites/:token/accept", acceptProjectInviteController);

// Attachment management routes
projectRouter.get("/:id/attachments", getProjectAttachmentsController);
projectRouter.post("/:id/attachments", upload.single("file"), createProjectAttachmentController);
projectRouter.delete("/:id/attachments/:attachmentId", deleteProjectAttachmentController);

export default projectRouter;

