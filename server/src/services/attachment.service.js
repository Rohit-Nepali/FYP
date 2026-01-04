export const attachmentService = {
  create: async ({ file, taskId, userId }) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new ApiError("Task not found", HTTP_STATUS.NOT_FOUND);
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/tasks/${file.filename}`,
        uploadedBy: userId,
      },
    });

    return attachment;
  },
};
