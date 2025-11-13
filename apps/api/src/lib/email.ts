import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import {
  getVerificationEmailTemplate,
  getResendVerificationEmailTemplate,
} from './email-templates.js';

interface EmailService {
  sendVerificationEmail(
    email: string,
    token: string,
    name: string
  ): Promise<void>;
  sendResendVerificationEmail(
    email: string,
    token: string,
    name: string
  ): Promise<void>;
}

class SMTPEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter based on environment configuration
    if (env.EMAIL_SERVICE === 'sendgrid' && env.SENDGRID_API_KEY) {
      // SendGrid configuration
      this.transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: env.SENDGRID_API_KEY,
        },
      });
    } else if (env.SMTP_HOST) {
      // Custom SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
      });
    } else {
      // Development: Use Ethereal Email (fake SMTP for testing)
      // In production, this should be configured properly
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test',
        },
      });
    }
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    name: string
  ): Promise<void> {
    const verificationUrl = `${env.VERIFICATION_BASE_URL}/verify-email?token=${token}`;
    const html = getVerificationEmailTemplate(name, verificationUrl);

    const mailOptions = {
      from: env.EMAIL_FROM
        ? `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`
        : `"${env.EMAIL_FROM_NAME}" <noreply@grouppay.com>`,
      to: email,
      subject: 'Verify your email address - Group Pay',
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      
      // In development with Ethereal, log the preview URL
      if (env.NODE_ENV === 'development' && info.response.includes('ethereal')) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendResendVerificationEmail(
    email: string,
    token: string,
    name: string
  ): Promise<void> {
    const verificationUrl = `${env.VERIFICATION_BASE_URL}/verify-email?token=${token}`;
    const html = getResendVerificationEmailTemplate(name, verificationUrl);

    const mailOptions = {
      from: env.EMAIL_FROM
        ? `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`
        : `"${env.EMAIL_FROM_NAME}" <noreply@grouppay.com>`,
      to: email,
      subject: 'Verify your email address - Group Pay',
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Resend verification email sent:', info.messageId);
      
      // In development with Ethereal, log the preview URL
      if (env.NODE_ENV === 'development' && info.response.includes('ethereal')) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Error sending resend verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }
}

// Export singleton instance
export const emailService = new SMTPEmailService();

