import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
	addPushTokenController,
	archiveNotificationController,
	deleteAccountController,
	deleteNotificationController,
	getNotificationsController,
	getUnreadNotificationCountController,
	markNotificationAsIgnoredController,
	markAllNotificationsAsReadController,
	markNotificationAsReadController,
	unarchiveNotificationController,
	searchUsersController,
	updateProfileController,
	uploadAvatarController,
	updateDigestPreferencesController,
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
userRouter.patch("/notifications/:notificationId/ignored", markNotificationAsIgnoredController);
userRouter.patch("/notifications/:notificationId/archive", archiveNotificationController);
userRouter.patch("/notifications/:notificationId/unarchive", unarchiveNotificationController);
userRouter.delete("/notifications/:notificationId", deleteNotificationController);

// Profile routes
userRouter.put("/profile", updateProfileController);
userRouter.delete("/profile", deleteAccountController);
userRouter.post("/profile/avatar", uploadAvatar.single("file"), uploadAvatarController);
userRouter.patch("/preferences/digest", updateDigestPreferencesController);

//notificatoin routes

export default userRouter;
