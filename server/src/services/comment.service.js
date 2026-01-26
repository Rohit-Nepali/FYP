import { prisma } from "#config/db.js";
import { sendPushNotification } from "./notification.service.js";

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
      task: {
        select: {
          title: true,
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
        token: comment.task.assignee.pushToken,
        title: "New Comment",
        body: `${comment.author.name} commented on task: ${comment.task.title || 'Untitled'}`,
      });
    }

    // Notify project members (except author and assignee)
    comment.task.project.members.forEach(member => {
      if (member.userId !== authorId && member.userId !== comment.task.assignee?.id && member.user.pushToken) {
        notifications.push({
          token: member.user.pushToken,
          title: "New Comment",
          body: `${comment.author.name} commented on task: ${comment.task.title || 'Untitled'}`,
        });
      }
    });

    // Send all notifications
    for (const notification of notifications) {
      await sendPushNotification(
        notification.token,
        notification.title,
        notification.body,
        { taskId, commentId: comment.id, type: "new_comment" }
      );
    }
  } catch (error) {
    console.error("Failed to send comment notifications:", error);
  }

  return comment;
};

const getCommentsByTask = async (taskId) => {
  console.log("task id ", taskId)
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