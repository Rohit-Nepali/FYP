import { Router } from "express";
import { signUpController } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/sign-up", signUpController);

export default authRouter;
