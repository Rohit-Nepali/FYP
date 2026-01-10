import joi from "joi";

export const createCommentSchema = joi.object({
  taskId: joi.string().required().messages({
    'string.empty': 'Task ID is required',
    'any.required': 'Task ID is required',
  }),
  content: joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Comment content cannot be empty',
    'string.min': 'Comment content cannot be empty',
    'string.max': 'Comment content cannot exceed 1000 characters',
    'any.required': 'Comment content is required',
  }),
});

export const updateCommentSchema = joi.object({
  content: joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Comment content cannot be empty',
    'string.min': 'Comment content cannot be empty',
    'string.max': 'Comment content cannot exceed 1000 characters',
    'any.required': 'Comment content is required',
  }),
});