import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password from Gmail
    },
  });
};

export const EmailService = {
  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Password reset token
   * @param {string} resetLink - Full reset link URL
   */
  sendPasswordResetEmail: async (email, resetToken, resetLink) => {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Nexora Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request - Nexora Admin",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background: #ffffff;
                  border: 1px solid #e5e5e5;
                  border-radius: 8px;
                  padding: 40px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 24px;
                  font-weight: 300;
                  letter-spacing: 2px;
                  color: #000;
                  margin-bottom: 10px;
                }
                .content {
                  margin: 30px 0;
                }
                .button {
                  display: inline-block;
                  padding: 14px 32px;
                  background: #000000;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: 500;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                  font-size: 13px;
                  margin: 20px 0;
                }
                .button:hover {
                  background: #333333;
                }
                .link {
                  color: #000;
                  word-break: break-all;
                  font-size: 12px;
                  margin-top: 20px;
                  padding: 15px;
                  background: #f5f5f5;
                  border-radius: 4px;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e5e5;
                  font-size: 12px;
                  color: #737373;
                  text-align: center;
                }
                .warning {
                  background: #fff3cd;
                  border: 1px solid #ffc107;
                  border-radius: 4px;
                  padding: 15px;
                  margin: 20px 0;
                  font-size: 12px;
                  color: #856404;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">NEXORA</div>
                  <h1 style="font-size: 20px; font-weight: 300; margin: 0;">Password Reset Request</h1>
                </div>
                
                <div class="content">
                  <p>Hello,</p>
                  <p>We received a request to reset your password for your Nexora Admin account.</p>
                  <p>Click the button below to reset your password:</p>
                  
                  <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                  </div>
                  
                  <p>Or copy and paste this link into your browser:</p>
                  <div class="link">${resetLink}</div>
                  
                  <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>This link will expire in 1 hour</li>
                      <li>If you didn't request this, please ignore this email</li>
                      <li>Never share this link with anyone</li>
                    </ul>
                  </div>
                </div>
                
                <div class="footer">
                  <p>This is an automated email. Please do not reply.</p>
                  <p>&copy; 2024 Nexora. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
          Password Reset Request - Nexora Admin
          
          Hello,
          
          We received a request to reset your password for your Nexora Admin account.
          
          Click the link below to reset your password:
          ${resetLink}
          
          This link will expire in 1 hour.
          
          If you didn't request this, please ignore this email.
          
          © 2024 Nexora. All rights reserved.
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Password reset email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Send welcome email (optional)
   */
  sendWelcomeEmail: async (email, name) => {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Nexora Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to Nexora Admin",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to Nexora Admin, ${name}!</h1>
            <p>Your account has been successfully created.</p>
            <p>You can now access the admin dashboard and start managing your system.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Welcome email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Send custom email (for communication center)
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} content - Email content (HTML)
   */
  sendCustomEmail: async (email, subject, content) => {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Nexora Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background: #ffffff;
                  border: 1px solid #e5e5e5;
                  border-radius: 8px;
                  padding: 40px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 24px;
                  font-weight: 300;
                  letter-spacing: 2px;
                  color: #000;
                  margin-bottom: 10px;
                }
                .content {
                  margin: 30px 0;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e5e5;
                  font-size: 12px;
                  color: #737373;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">NEXORA</div>
                </div>
                
                <div class="content">
                  ${content}
                </div>
                
                <div class="footer">
                  <p>This is an automated email from Nexora Admin.</p>
                  <p>&copy; 2024 Nexora. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: content.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Custom email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending custom email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },
};

