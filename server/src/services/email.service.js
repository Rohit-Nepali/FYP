import nodemailer from "nodemailer";
import logger from "../config/logger.js";

let transporter;

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
  }

};
