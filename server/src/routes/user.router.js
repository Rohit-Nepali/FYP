import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { searchUsersController } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.use(authenticateToken);

userRouter.get("/", searchUsersController);

export default userRouter;
