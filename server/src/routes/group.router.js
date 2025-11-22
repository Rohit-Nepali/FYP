import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createGroupController,
  getAllGroupsController,
  getGroupByIdController,
  updateGroupController,
  deleteGroupController,
  addMemberController,
  removeMemberController,
  createInviteController,
  acceptInviteController,
  getInvitesController,
} from "../controllers/group.controller.js";
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
} from "../validator/group.validator.js";

const groupRouter = Router();

// All group routes require authentication
groupRouter.use(authenticateToken);

// Group CRUD routes
groupRouter.post("/", validate(createGroupSchema), createGroupController);
groupRouter.get("/", getAllGroupsController);
groupRouter.get("/:id", getGroupByIdController);
groupRouter.put("/:id", validate(updateGroupSchema), updateGroupController);
groupRouter.delete("/:id", deleteGroupController);

// Member management routes
groupRouter.post(
  "/:id/members",
  validate(addMemberSchema),
  addMemberController
);
groupRouter.delete("/:id/members/:memberId", removeMemberController);

// Invite management routes
groupRouter.post("/:id/invites", createInviteController);
groupRouter.get("/:id/invites", getInvitesController);
groupRouter.post("/invites/:token/accept", acceptInviteController);

export default groupRouter;
