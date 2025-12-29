import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
    acceptProjectInviteController,
    addProjectMemberController,
    createProjectController,
    createProjectInviteController,
    deleteProjectController,
    getAllProjectsController,
    getProjectByIdController,
    getProjectInvitesController,
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
projectRouter.get("/:id", getProjectByIdController);
projectRouter.put("/:id", validate(updateProjectSchema), updateProjectController);
projectRouter.delete("/:id", deleteProjectController);

projectRouter.post(
    "/:id/members",
    validate(addProjectMemberSchema),
    addProjectMemberController
);
projectRouter.delete("/:id/members/:memberId", removeProjectMemberController);

// Invite management routes
projectRouter.post("/:id/invites", createProjectInviteController);
projectRouter.get("/:id/invites", acceptProjectInviteController);
projectRouter.post("/invites/:token/accept", getProjectInvitesController);
    

export default projectRouter;

