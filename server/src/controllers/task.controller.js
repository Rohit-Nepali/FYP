import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/response.utils.js";
import { taskService } from "../services/task.service.js";
import { CLIENT_RENEG_LIMIT } from "tls";
import { logActivity } from "../services/activity.service.js";

export const createTaskController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const taskData = req.body;

        const task = await taskService.create(taskData, userId);

        // Log activity
        if (task.projectId) {
            await logActivity({
                type: 'TASK_CREATED',
                projectId: task.projectId,
                userId,
                taskId: task.id,
                metadata: { taskTitle: task.title }
            });
        }

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.CREATED,
            SUCCESS_MESSAGES.CREATED,
            task
        );
    } catch (error) {
        next(error);
    }
};

export const getAllTasksController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            page: req.query.page || 1,
            limit: req.query.limit || 10,
        };

        const result = await taskService.getAll(userId, filters);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            result.tasks,
            result.pagination
        );
    } catch (error) {
        next(error);
    }
};

export const getTaskByIdController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const task = await taskService.getById(id, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            task
        );
    } catch (error) {
        next(error);
    }
};

export const updateTaskController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updateData = req.body;

        const task = await taskService.update(id, userId, updateData);

        // Log activity
        if (task.projectId) {
            await logActivity({
                type: 'TASK_UPDATED',
                projectId: task.projectId,
                userId,
                taskId: task.id,
                metadata: { taskTitle: task.title }
            });
        }

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED,
            task
        );
    } catch (error) {
        next(error);
    }
};

export const deleteTaskController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await taskService.delete(id, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.DELETED
        );
    } catch (error) {
        next(error);
    }
};

export const getProjectTasksController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;

        const tasks = await taskService.getAllForProject(projectId, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            tasks
        );
    } catch (error) {
        next(error);
    }
};

