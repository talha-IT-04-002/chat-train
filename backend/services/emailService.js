const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const host = process.env.EMAIL_HOST;
    const portEnv = process.env.EMAIL_PORT;
    const port = portEnv ? Number(portEnv) : undefined;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn('EmailService: EMAIL_USER or EMAIL_PASS not set. Email sending will fail.');
      return;
    }

    let transportConfig;

    if (!host && !port) {
      transportConfig = {
        service: 'gmail',
        auth: { user, pass }
      };
    } else {
      const isSecure = port === 465;
      transportConfig = {
        host: host || 'smtp.gmail.com',
        port: port || 587,
        secure: isSecure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      };
    }

    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_EMAIL) {
      console.log('EmailService: Transport config:', {
        host: transportConfig.host,
        port: transportConfig.port,
        secure: transportConfig.secure,
        user: transportConfig.auth.user,
        pass: transportConfig.auth.pass ? '[HIDDEN]' : 'NOT SET'
      });
    }

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  async sendVerificationEmail(email, token, firstName) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"Chat Train" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your Chat Train account',
      html: this.getVerificationEmailTemplate(firstName, verificationUrl, email)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email, token, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"Chat Train" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your Chat Train password',
      html: this.getPasswordResetEmailTemplate(firstName, resetUrl, email)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTeamInviteEmail({ toEmail, inviteUrl, organizationName, inviterName, role }) {
    const subject = `You're invited to join ${organizationName} on Chat Train`;

    const html = this.getTeamInviteEmailTemplate({ inviteUrl, organizationName, inviterName, role, recipientEmail: toEmail });

    const mailOptions = {
      from: `"Chat Train" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Team invite email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending team invite email:', error);
      return { success: false, error: error.message };
    }
  }

  getVerificationEmailTemplate(firstName, verificationUrl, recipientEmail) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your Chat Train account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #40B1DF 0%, #3aa0c9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #40B1DF 0%, #3aa0c9 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Chat Train!</h1>
            <p>AI-Powered Training Platform</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for creating your Chat Train account! To get started, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #40B1DF;">${verificationUrl}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>If you didn't create a Chat Train account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Chat Train. All rights reserved.</p>
            <p>This email was sent to ${recipientEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getTeamInviteEmailTemplate({ inviteUrl, organizationName, inviterName, role, recipientEmail }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to ${organizationName} on Chat Train</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #40B1DF 0%, #3aa0c9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #40B1DF 0%, #3aa0c9 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Team Invitation</h1>
            <p>${organizationName} on Chat Train</p>
          </div>
          <div class="content">
            <p>${inviterName} invited you to join <strong>${organizationName}</strong> as <strong>${role}</strong>.</p>
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #40B1DF;">${inviteUrl}</p>
            <p>This link will expire in 7 days.</p>
          </div>
          <div class="footer">
            <p>© 2024 Chat Train. All rights reserved.</p>
            <p>This email was sent to ${recipientEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailTemplate(firstName, resetUrl, recipientEmail) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your Chat Train password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #40B1DF 0%, #3aa0c9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #40B1DF 0%, #3aa0c9 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
            <p>Chat Train Account Security</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your Chat Train account password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #40B1DF;">${resetUrl}</p>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2024 Chat Train. All rights reserved.</p>
            <p>This email was sent to ${recipientEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return { success: true };
    } catch (error) {
      console.error('Email service connection failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
