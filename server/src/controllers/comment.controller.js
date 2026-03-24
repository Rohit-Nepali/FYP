import { ApiResponse, HTTP_STATUS, SUCCESS_MESSAGES } from '#utils/response.utils.js';
import commentService from '../services/comment.service.js';
import { logActivity } from '../services/activity.service.js';
import { prisma } from '#config/db.js';

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
    try {
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
    } catch (activityError) {
      // Log activity errors shouldn't fail the comment creation
      console.warn('Failed to log comment activity:', activityError);
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
    const userId = req.user.id;
    const comments = await commentService.getCommentsByTask(taskId, userId);
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

    // Get comment details before update for activity logging
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, taskId: true, content: true }
    });

    const comment = await commentService.updateComment(id, content, userId);

    // Log activity
    // Log activity - wrap in try-catch so activity logging doesn't fail the request
    try {
      if (existingComment) {
      const task = await prisma.task.findUnique({
        where: { id: existingComment.taskId },
        select: { id: true, title: true, projectId: true }
      });

      if (task && task.projectId) {
        await logActivity({
          type: 'COMMENT_UPDATED',
          projectId: task.projectId,
          userId,
          taskId: task.id,
          commentId: comment.id,
          metadata: {
            taskTitle: task.title,
            oldContent: existingComment.content.substring(0, 50),
            newContent: content.substring(0, 50)
          }
        });
      }
      }
    } catch (activityError) {
      console.warn('Failed to log comment activity:', activityError);
    }

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

    // Get comment details before deletion for activity logging
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, taskId: true, content: true }
    });

    await commentService.deleteComment(id, userId);

    // Log activity - wrap in try-catch so activity logging doesn't fail the request
    try {
      if (existingComment) {
      const task = await prisma.task.findUnique({
        where: { id: existingComment.taskId },
        select: { id: true, title: true, projectId: true }
      });

      if (task && task.projectId) {
        await logActivity({
          type: 'COMMENT_DELETED',
          projectId: task.projectId,
          userId,
          taskId: task.id,
          commentId: existingComment.id,
          metadata: {
            taskTitle: task.title,
            deletedContent: existingComment.content.substring(0, 50)
          }
        });
      }
      }
    } catch (activityError) {
      console.warn('Failed to log comment activity:', activityError);
    }

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