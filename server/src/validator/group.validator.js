import joi from "joi";

const groupRoleEnum = ["admin", "member"];

export const createGroupSchema = joi.object({
  name: joi.string().min(1).max(100).trim().required(),
  description: joi.string().max(500).trim().allow("", null).optional(),
});

export const updateGroupSchema = joi.object({
  name: joi.string().min(1).max(100).trim().optional(),
  description: joi.string().max(500).trim().allow("", null).optional(),
});

export const addMemberSchema = joi.object({
  memberId: joi.string().uuid().required(),
  role: joi
    .string()
    .valid(...groupRoleEnum)
    .optional(),
});
