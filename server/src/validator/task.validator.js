import joi from "joi";

export const createTaskSchema = joi.object({
    title: joi.string().min(1).max(200).trim().required(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
    statusId: joi.string().optional(),
    priorityId: joi.string().optional(),
    dueDate: joi.date().iso().allow(null).optional(),
    projectId: joi.string().allow(null).optional(),
    assigneeId: joi.string().allow(null).optional(),
});

export const updateTaskSchema = joi.object({
    title: joi.string().min(1).max(200).trim().optional(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
    statusId: joi.string().optional(),
    priorityId: joi.string().optional(),
    dueDate: joi.date().iso().allow(null).optional(),
    assigneeId: joi.string().allow(null).optional(),
    projectId: joi.string().optional(),
});

