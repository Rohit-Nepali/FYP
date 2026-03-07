import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Task attachment storage
const taskStorage = multer.diskStorage({
  destination: (_, file, cb) => {
    const dir = "uploads/tasks";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Project attachment storage
const projectStorage = multer.diskStorage({
  destination: (_, file, cb) => {
    const dir = "uploads/projects";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// User avatar storage
const avatarStorage = multer.diskStorage({
  destination: (_, file, cb) => {
    const dir = "uploads/avatars";
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadTaskAttachment = multer({
  storage: taskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadProjectAttachment = multer({
  storage: projectStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const upload = uploadProjectAttachment; // Default export for project attachments
