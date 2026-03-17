import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendVerificationEmail(email: string, token: string) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Mailer] SMTP not configured. Verification link: ${env.CLIENT_URL}/auth/verify-email?token=${token}`);
    return;
  }

  const verifyUrl = `${env.CLIENT_URL}/auth/verify-email?token=${token}`;

  await transport.sendMail({
    from: `"HelpDesk System" <${env.SMTP_USER}>`,
    to: email,
    subject: 'Xác nhận email - HelpDesk',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">HelpDesk — Xác nhận email</h2>
        <p>Bạn vừa đăng ký tài khoản HelpDesk. Vui lòng bấm nút bên dưới để xác nhận email:</p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 24px; background: #10b981;
                  color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Xác Nhận Email
        </a>
        <p style="color: #666; font-size: 14px;">Link này có hiệu lực trong 24 giờ.</p>
      </div>
    `,
  });
}
