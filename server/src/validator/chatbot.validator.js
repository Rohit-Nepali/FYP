import joi from "joi";

export const chatbotMessageSchema = joi.object({
  message: joi.string().trim().min(1).max(1000).required(),
  taskId: joi.string().allow(null).optional(),
});
