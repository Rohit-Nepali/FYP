import nodemailer from "nodemailer";
import logger from "../config/logger.js";

/**
 * Create an Ethereal transporter for testing emails
 */
const createTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("Ethereal user:", testAccount.user);
  console.log("Ethereal pass:", testAccount.pass);

  return transporter;
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
      const transporter = await createTransporter();

      const mailOptions = {
        from: `"${appName}" <no-reply@${appName.toLowerCase()}.com>`,
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

      const info = await transporter.sendMail(mailOptions);

      logger.info(`Password reset email sent to ${email}`);
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`); // view in browser
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
      const transporter = await createTransporter();

      const mailOptions = {
        from: `"${appName}" <no-reply@${appName.toLowerCase()}.com>`,
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

      const info = await transporter.sendMail(mailOptions);

      logger.info(`Password reset confirmation email sent to ${email}`);
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`); // view in browser
    } catch (error) {
      logger.error(`Failed to send password reset confirmation email: ${error.message}`);
      throw error;
    }
  },
};
