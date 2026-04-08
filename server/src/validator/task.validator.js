import joi from "joi";

const pastDateValidation = (value, helpers) => {
    if (value === null || value === undefined) {
        return value;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return helpers.error("date.base");
    }

    if (parsedDate < new Date()) {
        return helpers.message("Due date cannot be in the past");
    }

    return value;
};

export const createTaskSchema = joi.object({
    title: joi.string().min(1).max(200).trim().required(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
    isCompleted: joi.boolean().optional(),
    statusId: joi.string().allow(null).optional(),
    priorityId: joi.string().allow(null).optional(),
    dueDate: joi.date().iso().allow(null).optional().custom(pastDateValidation),
    projectId: joi.string().allow(null).optional(),
    assigneeId: joi.string().allow(null).optional(),
});

export const updateTaskSchema = joi.object({
    title: joi.string().min(1).max(200).trim().optional(),
    description: joi.string().max(1000).trim().allow("", null).optional(),
    isCompleted: joi.boolean().optional(),
    statusId: joi.string().allow(null).optional(),
    priorityId: joi.string().allow(null).optional(),
    dueDate: joi.date().iso().allow(null).optional(),
    assigneeId: joi.string().allow(null).optional(),
    projectId: joi.string().optional(),
});

