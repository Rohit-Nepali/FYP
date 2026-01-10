import commentService from '../services/comment.service.js';


const createComment = async (req, res) => {
  try {
    const { taskId, content } = req.body;
    const authorId = req.user.id;

    const comment = await commentService.createComment({
      taskId,
      content,
      authorId,
    });

    responseUtils.success(res, 'Comment created successfully', comment, 201);
  } catch (error) {
    responseUtils.error(res, error.message);
  }
};

const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await commentService.getCommentsByTask(taskId);
    responseUtils.success(res, 'Comments retrieved successfully', comments);
  } catch (error) {
    responseUtils.error(res, error.message);
  }
};

const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await commentService.updateComment(id, content, userId);
    responseUtils.success(res, 'Comment updated successfully', comment);
  } catch (error) {
    responseUtils.error(res, error.message);
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await commentService.deleteComment(id, userId);
    responseUtils.success(res, 'Comment deleted successfully');
  } catch (error) {
    responseUtils.error(res, error.message);
  }
};

export {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
};