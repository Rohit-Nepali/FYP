import joi from "joi";

export const createProjectSchema = joi.object({
    title: joi.string().min(1).max(200).trim().required(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
});

export const updateProjectSchema = joi.object({
    title: joi.string().min(1).max(200).trim().optional(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
    status: joi.string().valid("todo", "in_progress", "done").optional(),
});

export const addProjectMemberSchema = joi.object({
    memberId: joi.string().optional(),
    userIds: joi.array().items(joi.string()).min(1).optional(),
    role: joi.string().valid("member").optional(),
}).or("memberId", "userIds");

export const createProjectInviteSchema = joi.object({
    email: joi.string().email().required(),
    role: joi.string().valid("member").optional(),
});

