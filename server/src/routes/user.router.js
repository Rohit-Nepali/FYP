import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
	addPushTokenController,
	archiveNotificationController,
	deleteNotificationController,
	getNotificationsController,
	getUnreadNotificationCountController,
	markAllNotificationsAsReadController,
	markNotificationAsReadController,
	unarchiveNotificationController,
	searchUsersController,
	updateProfileController,
	uploadAvatarController,
} from "../controllers/user.controller.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const userRouter = Router();

userRouter.use(authenticateToken);

userRouter.get("/", searchUsersController);

userRouter.post("/push-token", addPushTokenController);
userRouter.get("/notifications", getNotificationsController);
userRouter.get("/notifications/unread-count", getUnreadNotificationCountController);
userRouter.patch("/notifications/read-all", markAllNotificationsAsReadController);
userRouter.patch("/notifications/:notificationId/read", markNotificationAsReadController);
userRouter.patch("/notifications/:notificationId/archive", archiveNotificationController);
userRouter.patch("/notifications/:notificationId/unarchive", unarchiveNotificationController);
userRouter.delete("/notifications/:notificationId", deleteNotificationController);

// Profile routes
userRouter.put("/profile", updateProfileController);
userRouter.post("/profile/avatar", uploadAvatar.single("file"), uploadAvatarController);

//notificatoin routes

export default userRouter;
