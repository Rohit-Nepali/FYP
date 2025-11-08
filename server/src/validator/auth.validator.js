import joi from "joi";

export const signUpSchema = joi.object({
  name: joi.string().min(2).max(100).trim().required(),
  email: joi.string().email().lowercase().trim().required(),
  password: joi.string().min(6).required(),
});

export const signInSchema = joi.object({
  email: joi.string().email().lowercase().trim().required(),
  password: joi.string().required(),
});

export const refreshTokenSchema = joi.object({
  refreshToken: joi.string().required(),
});
