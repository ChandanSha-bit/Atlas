import nodemailer from 'nodemailer';
import logger from './logger';

interface SendEmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

const sendEmail = async (options: SendEmailOptions) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `"${process.env.FROM_NAME || 'Atlas AI'}" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  logger.info(`Email sent to ${options.email}: ${info.messageId}`);
};

export default sendEmail;
