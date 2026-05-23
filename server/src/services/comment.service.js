import { prisma } from "#config/db.js";
import { NotFoundError, AuthorizationError } from "#utils/error.utils.js";
import { emailService } from "./email.service.js";

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

  // Send email notifications to task assignee and project members (except author)
  try {
    const recipients = [];

    // Notify assignee if different from author
    if (comment.task.assignee && comment.task.assignee.id !== authorId) {
      recipients.push({
        id: comment.task.assignee.id,
      });
    }

    // Notify project members (except author and assignee)
    comment.task.project?.members?.forEach((member) => {
      if (
        member.userId !== authorId &&
        member.userId !== comment.task.assignee?.id
      ) {
        recipients.push({
          id: member.userId,
        });
      }
    });

    const uniqueRecipientIds = [...new Set(recipients.map((recipient) => recipient.id))];

    if (uniqueRecipientIds.length > 0 && emailService.isSmtpConfigured()) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: uniqueRecipientIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      for (const user of users) {
        if (!user.email) {
          continue;
        }

        await emailService.sendCommentAddedEmail({
          email: user.email,
          recipientName: user.name,
          taskTitle: comment.task.title,
          commentAuthorName: comment.author.name,
          commentContent: comment.content,
          projectTitle: task.project?.title,
        });
      }
    }
  } catch (error) {
    console.error("Failed to send comment email notifications:", error);
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