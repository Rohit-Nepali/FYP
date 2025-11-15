import joi from "joi";

const taskStatusEnum = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const taskPriorityEnum = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const createTaskSchema = joi.object({
    title: joi.string().min(1).max(200).trim().required(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
    status: joi.string().valid(...taskStatusEnum).optional(),
    priority: joi.string().valid(...taskPriorityEnum).optional(),
    dueDate: joi.date().iso().allow(null).optional(),
});

export const updateTaskSchema = joi.object({
    title: joi.string().min(1).max(200).trim().optional(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
    status: joi.string().valid(...taskStatusEnum).optional(),
    priority: joi.string().valid(...taskPriorityEnum).optional(),
    dueDate: joi.date().iso().allow(null).optional(),
});

