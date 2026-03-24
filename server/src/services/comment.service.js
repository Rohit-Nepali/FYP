import { prisma } from "#config/db.js";
import { createInAppNotification, sendPushNotification } from "./notification.service.js";
import { NotFoundError, AuthorizationError } from "#utils/error.utils.js";

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
    throw new NotFoundError('Task not found');
  }

  // Access rules:
  // - Project task: user must be project owner or project member
  // - Standalone task (no project): user must be creator or assignee
  if (task.project) {
    const isMember = task.project.members.some(
      (member) => member.userId === authorId
    );
    const isOwner = task.project.ownerId === authorId;

    if (!isMember && !isOwner) {
      throw new AuthorizationError('You are not a member of this project');
    }
  } else {
    const isCreator = task.creatorId === authorId;
    const isAssignee = task.assigneeId === authorId;

    if (!isCreator && !isAssignee) {
      throw new AuthorizationError('You are not allowed to comment on this task');
    }
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
      task: {
        select: {
          title: true,
          creatorId: true,
          assignee: {
            select: {
              id: true,
              pushToken: true,
            },
          },
          project: {
            select: {
              members: {
                select: {
                  userId: true,
                  user: {
                    select: {
                      id: true,
                      pushToken: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Send notifications to task assignee and project members (except author)
  try {
    const notifications = [];

    // Notify assignee if different from author
    if (comment.task.assignee && comment.task.assignee.id !== authorId && comment.task.assignee.pushToken) {
      notifications.push({
        userId: comment.task.assignee.id,
        token: comment.task.assignee.pushToken,
        title: "New Comment",
        body: `${comment.author.name} commented on task: ${comment.task.title || 'Untitled'}`,
      });
    } else if (comment.task.assignee && comment.task.assignee.id !== authorId) {
      notifications.push({
        userId: comment.task.assignee.id,
        token: null,
        title: "New Comment",
        body: `${comment.author.name} commented on task: ${comment.task.title || 'Untitled'}`,
      });
    }

    // Notify project members (except author and assignee)
    comment.task.project?.members?.forEach((member) => {
      if (
        member.userId !== authorId &&
        member.userId !== comment.task.assignee?.id &&
        member.user.pushToken
      ) {
        notifications.push({
          userId: member.userId,
          token: member.user.pushToken,
          title: "New Comment",
          body: `${comment.author.name} commented on task: ${comment.task.title || 'Untitled'}`,
        });
      } else if (
        member.userId !== authorId &&
        member.userId !== comment.task.assignee?.id
      ) {
        notifications.push({
          userId: member.userId,
          token: null,
          title: "New Comment",
          body: `${comment.author.name} commented on task: ${comment.task.title || 'Untitled'}`,
        });
      }
    });

    // Send all notifications
    for (const notification of notifications) {
      await createInAppNotification({
        userId: notification.userId,
        type: "COMMENT_ADDED",
        title: notification.title,
        message: notification.body,
        data: { taskId, commentId: comment.id, type: "new_comment" },
      });

      if (notification.token) {
        await sendPushNotification(
          notification.token,
          notification.title,
          notification.body,
          { taskId, commentId: comment.id, type: "new_comment" }
        );
      }
    }
  } catch (error) {
    console.error("Failed to send comment notifications:", error);
  }

  return comment;
};

const getCommentsByTask = async (taskId, userId) => {
  // Verify task exists and user has access to it
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          ownerId: true,
          members: {
            select: { userId: true }
          }
        }
      }
    }
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  // Access rules:
  // - Project task: user must be project owner or project member
  // - Standalone task (no project): user must be creator or assignee
  if (task.project) {
    const isMember = task.project.members.some(
      (member) => member.userId === userId
    );
    const isOwner = task.project.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new AuthorizationError('You are not a member of this project');
    }
  } else {
    const isCreator = task.creatorId === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isCreator && !isAssignee) {
      throw new AuthorizationError('You are not allowed to view comments on this task');
    }
  }

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
    throw new NotFoundError('Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new AuthorizationError('You can only edit your own comments');
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
    throw new NotFoundError('Comment not found');
  }

  if (comment.authorId !== userId) {
    throw new AuthorizationError('You can only delete your own comments');
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