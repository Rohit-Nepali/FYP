import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { addPushTokenController, searchUsersController, updateProfileController, uploadAvatarController } from "../controllers/user.controller.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const userRouter = Router();

userRouter.use(authenticateToken);

userRouter.get("/", searchUsersController);

userRouter.post("/push-token", addPushTokenController);

// Profile routes
userRouter.put("/profile", updateProfileController);
userRouter.post("/profile/avatar", uploadAvatar.single("file"), uploadAvatarController);

//notificatoin routes

export default userRouter;
