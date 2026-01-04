import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/tasks",
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadTaskAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
