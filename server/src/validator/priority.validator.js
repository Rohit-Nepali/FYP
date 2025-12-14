import joi from "joi";

export const createPrioritySchema = joi.object({
  name: joi.string().min(1).max(50).trim().required(),
  color: joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow("", null).optional(),
  order: joi.number().integer().min(0).optional(),
});

export const updatePrioritySchema = joi.object({
  name: joi.string().min(1).max(50).trim().optional(),
  color: joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow("", null).optional(),
  order: joi.number().integer().min(0).optional(),
});
