import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { chatbotMessageSchema } from "../validator/chatbot.validator.js";
import { postChatbotMessageController } from "../controllers/chatbot.controller.js";

const chatbotRouter = Router();

chatbotRouter.use(authenticateToken);
chatbotRouter.post("/message", validate(chatbotMessageSchema), postChatbotMessageController);

export default chatbotRouter;
