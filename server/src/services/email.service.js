import nodemailer from "nodemailer";
import logger from "../config/logger.js";

// Email transporter configuration
const createTransporter = () => {
  // Using Gmail SMTP for demonstration
  // In production, use environment variables for sensitive data
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
};

export const emailService = {
  /**
   * Send password reset email
   * @param {string} email - Recipient email address
   * @param {string} resetToken - Password reset token
   * @param {string} appName - Application name
   * @returns {Promise<void>}
   */
  sendPasswordResetEmail: async (email, otp, req, appName = "Taskora") => {
    try {
      const transporter = createTransporter();

      const protocal = req.headers["x-forwarded-proto"] || req.protocol;
      console.log("protocal is: ", protocal);

      const host = req.headers["x-forwarded-host"] || req.get("host");
      console.log("host is: ", host);

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Password Reset OTP - ${appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset OTP</h2>
            
            <p>Hello,</p>
            
            <p>We received a request to reset the password for your ${appName} account associated with this email address.</p>
            
            <p>Use the following One-Time Password (OTP) to reset your password:</p>
            
            <div style="margin: 20px 0; font-size: 22px; font-weight: bold;">
              ${otp}
            </div>
            
            <p><strong>Note:</strong> This OTP will expire in 10 minutes. Do not share it with anyone.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
            
            <p>Best regards,<br>The ${appName} Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
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
   * @returns {Promise<void>}
   */
  sendPasswordResetConfirmationEmail: async (email, appName = "Taskora") => {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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

      await transporter.sendMail(mailOptions);
      logger.info(`Password reset confirmation email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset confirmation email: ${error.message}`);
      throw error;
    }
  },
};
