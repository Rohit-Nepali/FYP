import nodemailer from "nodemailer";
import logger from "../config/logger.js";

let transporter;

const REQUIRED_SMTP_ENV_KEYS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];

const getMissingSmtpConfig = () =>
  REQUIRED_SMTP_ENV_KEYS.filter((key) => !process.env[key]);

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required SMTP config: ${name}`);
  }
  return value;
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const getFromAddress = (appName = "Taskora") => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || "no-reply@taskora.com";
  const fromName = process.env.SMTP_FROM_NAME || appName;
  return `"${fromName}" <${fromEmail}>`;
};

export const emailService = {
  isSmtpConfigured: () => getMissingSmtpConfig().length === 0,

  assertSmtpConfigured: () => {
    const missing = getMissingSmtpConfig();
    if (missing.length > 0) {
      throw new Error(`Missing required SMTP config: ${missing[0]}`);
    }
  },

  /**
   * Send email verification OTP email
   * @param {string} email - Recipient email address
   * @param {string} otp - One-time password
   * @param {string} appName - Application name
   */
  sendEmailVerificationCode: async (email, otp, appName = "Taskora") => {
    try {
      const mailer = getTransporter();

      const mailOptions = {
        from: getFromAddress(appName),
        to: email,
        subject: `Verify Your Email - ${appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email</h2>
            <p>Hello,</p>
            <p>Welcome to ${appName}! Please verify your email address using the code below:</p>
            <div style="margin: 20px 0; font-size: 22px; font-weight: bold;">${otp}</div>
            <p><strong>Note:</strong> This code will expire in 15 minutes.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <p>Best regards,<br>The ${appName} Team</p>
          </div>
        `,
      };

      await mailer.sendMail(mailOptions);

      logger.info(`Email verification code sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send email verification code: ${error.message}`);
      throw error;
    }
  },

  /**
   * Send password reset OTP email
   * @param {string} email - Recipient email address
   * @param {string} otp - One-time password
   * @param {string} appName - Application name
   */
  sendPasswordResetEmail: async (email, otp, appName) => {
    try {
      const mailer = getTransporter();

      const mailOptions = {
        from: getFromAddress(appName),
        to: email,
        subject: `Password Reset OTP - ${appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset OTP</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your ${appName} account associated with this email address.</p>
            <p>Use the following One-Time Password (OTP) to reset your password:</p>
            <div style="margin: 20px 0; font-size: 22px; font-weight: bold;">${otp}</div>
            <p><strong>Note:</strong> This OTP will expire in 10 minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The ${appName} Team</p>
          </div>
        `,
      };

      console.log("OTP is :", otp)

      await mailer.sendMail(mailOptions);

      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email: ${error.message}`);
      throw error;
    }
  },

  /**
   * Send password reset confirmation email
   * @param {string} email - Recipient email address
   * @param {string} appName - Application name
   */
  sendPasswordResetConfirmationEmail: async (email, appName = "Taskora") => {
    try {
      const mailer = getTransporter();

      const mailOptions = {
        from: getFromAddress(appName),
        to: email,
        subject: `Password Changed Successfully - ${appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed Successfully</h2>
            <p>Hello,</p>
            <p>Your password has been successfully changed.</p>
            <p>You can now log in with your new password.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>The ${appName} Team</p>
          </div>
        `,
      };

      await mailer.sendMail(mailOptions);

      logger.info(`Password reset confirmation email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset confirmation email: ${error.message}`);
      throw error;
    }
  },

  sendProjectInviteEmail: async (email, projectName, inviteLink, invitedBy) => {
    const mailer = getTransporter();
 
    const mailOptions = {
      from: getFromAddress("Taskora"),
      to: email,
      subject: `You're invited to join ${projectName}`,
      html: `
      <h2>Project Invitation</h2>
      <p>${invitedBy} has invited you to join <strong>${projectName}</strong>.</p>
      <p>Click the link below to accept the invitation:</p>
      <a href="${inviteLink}">${inviteLink}</a>
      <p>This invite will expire soon.</p>
    `,
    };

    await mailer.sendMail(mailOptions);
    logger.info(`Project invite email sent to ${email} for project ${projectName}`);
  },

  /**
   * Send task assignment email
   * @param {Object} payload - Assignment payload
   * @param {string} payload.email - Recipient email address
   * @param {string} payload.assigneeName - Assignee display name
   * @param {string} payload.taskTitle - Task title
   * @param {string} payload.projectTitle - Project title
   * @param {string} payload.assignedByName - Name of assigner
   */
  sendTaskAssignmentEmail: async ({
    email,
    assigneeName,
    taskTitle,
    projectTitle,
    assignedByName,
  }) => {
    try {
      const mailer = getTransporter();

      const mailOptions = {
        from: getFromAddress("Taskora"),
        to: email,
        subject: `New Task Assignment: ${taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You Have A New Task</h2>
            <p>Hello ${assigneeName || "there"},</p>
            <p><strong>${assignedByName || "A project owner"}</strong> assigned you a task in <strong>${projectTitle || "your project"}</strong>.</p>
            <div style="margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
              <p style="margin: 0;"><strong>Task:</strong> ${taskTitle}</p>
            </div>
            <p>Please open Taskora to view the details.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
            <p>Best regards,<br>The Taskora Team</p>
          </div>
        `,
      };

      await mailer.sendMail(mailOptions);
      logger.info(`Task assignment email sent to ${email} for task ${taskTitle}`);
    } catch (error) {
      logger.error(`Failed to send task assignment email: ${error.message}`);
      throw error;
    }
  },

  /**
   * Send project task attachment update email
   * @param {Object} payload - Attachment payload
   * @param {string} payload.email - Recipient email address
   * @param {string} payload.recipientName - Recipient display name
   * @param {string} payload.taskTitle - Task title
   * @param {string} payload.projectTitle - Project title
   * @param {string} payload.fileName - Uploaded file name
   * @param {string} payload.uploadedByName - Uploader name
   */
  sendTaskAttachmentAddedEmail: async ({
    email,
    recipientName,
    taskTitle,
    projectTitle,
    fileName,
    uploadedByName,
  }) => {
    try {
      const mailer = getTransporter();

      const mailOptions = {
        from: getFromAddress("Taskora"),
        to: email,
        subject: `New Attachment Added: ${taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Task Attachment</h2>
            <p>Hello ${recipientName || "there"},</p>
            <p><strong>${uploadedByName || "A teammate"}</strong> added an attachment to a task in <strong>${projectTitle || "your project"}</strong>.</p>
            <div style="margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
              <p style="margin: 0;"><strong>Task:</strong> ${taskTitle || "Untitled"}</p>
              <p style="margin: 8px 0 0 0;"><strong>Attachment:</strong> ${fileName || "File"}</p>
            </div>
            <p>Please open Taskora to view the task details.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
            <p>Best regards,<br>The Taskora Team</p>
          </div>
        `,
      };

      await mailer.sendMail(mailOptions);
      logger.info(`Task attachment email sent to ${email} for task ${taskTitle}`);
    } catch (error) {
      logger.error(`Failed to send task attachment email: ${error.message}`);
      throw error;
    }
  },

  /**
   * Send comment added email
   * @param {Object} payload - Comment payload
   * @param {string} payload.email - Recipient email address
   * @param {string} payload.recipientName - Recipient display name
   * @param {string} payload.taskTitle - Task title
   * @param {string} payload.commentAuthorName - Comment author name
   * @param {string} payload.commentContent - Comment body
   * @param {string} payload.projectTitle - Project title
   */
  sendCommentAddedEmail: async ({
    email,
    recipientName,
    taskTitle,
    commentAuthorName,
    commentContent,
    projectTitle,
  }) => {
    try {
      const mailer = getTransporter();

      const safeComment = commentContent || "A new comment was added.";

      const mailOptions = {
        from: getFromAddress("Taskora"),
        to: email,
        subject: `New Comment On Task: ${taskTitle || "Untitled"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Comment Added</h2>
            <p>Hello ${recipientName || "there"},</p>
            <p><strong>${commentAuthorName || "A teammate"}</strong> added a comment on <strong>${taskTitle || "a task"}</strong>${projectTitle ? ` in <strong>${projectTitle}</strong>` : ""}.</p>
            <div style="margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
              <p style="margin: 0;"><strong>Comment:</strong></p>
              <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${safeComment}</p>
            </div>
            <p>Please open Taskora to view and reply.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
            <p>Best regards,<br>The Taskora Team</p>
          </div>
        `,
      };

      await mailer.sendMail(mailOptions);
      logger.info(`Comment notification email sent to ${email} for task ${taskTitle || "Untitled"}`);
    } catch (error) {
      logger.error(`Failed to send comment notification email: ${error.message}`);
      throw error;
    }
  }

};
