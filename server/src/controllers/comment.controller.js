import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from '#utils/response.utils.js';
import commentService from '../services/comment.service.js';
import { logActivity } from '../services/activity.service.js';

const createComment = async (req, res, next) => {
  try {
    const { taskId, content } = req.body;
    const authorId = req.user.id;

    const comment = await commentService.createComment({
      taskId,
      content,
      authorId,
    });

    // Log activity - need to get task to get projectId
    const { prisma } = require('../config/prisma.config');
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, projectId: true }
    });

    if (task && task.projectId) {
      await logActivity({
        type: 'COMMENT_ADDED',
        projectId: task.projectId,
        userId: authorId,
        taskId: task.id,
        commentId: comment.id,
        metadata: {
          taskTitle: task.title,
          commentPreview: content.substring(0, 50)
        }
      });
    }

    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.CREATED,
      comment
    );

  } catch (error) {
    next(error);
  }
};

const getCommentsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await commentService.getCommentsByTask(taskId);
    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.RETRIEVED,
      comments
    );
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await commentService.updateComment(id, content, userId);
    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.UPDATED,
      comment
    );
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await commentService.deleteComment(id, userId);
    return ApiResponse.sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.DELETED
    );
  } catch (error) {
    next(error);
  }
};

export {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
};