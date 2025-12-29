import joi from "joi";

export const createProjectSchema = joi.object({
    title: joi.string().min(1).max(200).trim().required(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
});

export const updateProjectSchema = joi.object({
    title: joi.string().min(1).max(200).trim().optional(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
});

export const addProjectMemberSchema = joi.object({
    memberId: joi.string().required(),
    role: joi.string().valid("member").optional(),
});

