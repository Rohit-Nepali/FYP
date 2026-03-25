import joi from "joi";

export const predictTaskRiskSchema = joi.object({
  taskId: joi.string().required(),
});
