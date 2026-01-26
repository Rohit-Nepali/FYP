import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { addPushTokenController, searchUsersController } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.use(authenticateToken);

userRouter.get("/", searchUsersController);

userRouter.post("/push-token",addPushTokenController);
//notificatoin routes

export default userRouter;
