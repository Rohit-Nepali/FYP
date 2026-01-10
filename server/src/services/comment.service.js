import prisma from '../generated/prisma/index.js';

const createComment = async ({ taskId, content, authorId }) => {
  // Verify task exists and user has access
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: true,
          owner: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Check if user is project member or owner
  const isMember = task.project.members.some(member => member.userId === authorId);
  const isOwner = task.project.ownerId === authorId;

  if (!isMember && !isOwner) {
    throw new Error('Access denied: You are not a member of this project');
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      content,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  return comment;
};

const getCommentsByTask = async (taskId) => {
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return comments;
};

const updateComment = async (commentId, content, userId) => {
  // Find comment and verify ownership
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: true,
    },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new Error('Access denied: You can only edit your own comments');
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  return updatedComment;
};

const deleteComment = async (commentId, userId) => {
  // Find comment and verify ownership
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: true,
    },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new Error('Access denied: You can only delete your own comments');
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });
};

export default {
  createComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
};