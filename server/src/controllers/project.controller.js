import {
    ApiResponse,
    HTTP_STATUS,
    SUCCESS_MESSAGES,
} from "../utils/response.utils.js";
import { projectService } from "../services/project.service.js";

export const createProjectController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const projectData = req.body;

        const project = await projectService.create(projectData, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.CREATED,
            SUCCESS_MESSAGES.CREATED,
            project
        );
    } catch (error) {
        next(error);
    }
};

export const getAllProjectsController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const projects = await projectService.getAll(userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            projects
        );
    } catch (error) {
        next(error);
    }
};

export const getProjectByIdController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const project = await projectService.getById(id, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.RETRIEVED,
            project
        );
    } catch (error) {
        next(error);
    }
};

export const updateProjectController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updateData = req.body;

        const project = await projectService.update(id, userId, updateData);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.UPDATED,
            project
        );
    } catch (error) {
        next(error);
    }
};

export const deleteProjectController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await projectService.delete(id, userId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.DELETED
        );
    } catch (error) {
        next(error);
    }
};

export const addProjectMemberController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { memberId, role } = req.body;

        const project = await projectService.addMember(id, userId, memberId, role);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            "Member added successfully",
            project
        );
    } catch (error) {
        next(error);
    }
};

export const removeProjectMemberController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id, memberId } = req.params;

        const project = await projectService.removeMember(id, userId, memberId);

        return ApiResponse.sendSuccessResponse(
            res,
            HTTP_STATUS.OK,
            "Member removed successfully",
            project
        );
    } catch (error) {
        next(error);
    }
};

