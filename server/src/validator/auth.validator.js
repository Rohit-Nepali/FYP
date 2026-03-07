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

export const forgotPasswordSchema = joi.object({
  email: joi.string().email().lowercase().trim().required(),
});

export const verifyResetTokenSchema = joi.object({
  token: joi.string().required(),
});

export const resetPasswordSchema = joi.object({
  token: joi.string().required(),
  password: joi.string().min(6).required(),
});

export const googleSignUpSchema = joi.object({
  googleId: joi.string().required(),
  email: joi.string().email().lowercase().trim().required(),
  name: joi.string().min(2).max(100).trim().required(),
  profileImage: joi.string().uri().allow(null, ""),
  accessToken: joi.string().required(),
  refreshToken: joi.string().allow(null, ""),
});

export const googleSignInSchema = joi.object({
  googleId: joi.string().required(),
  email: joi.string().email().lowercase().trim().required(),
  accessToken: joi.string().required(),
  refreshToken: joi.string().allow(null, ""),
});
