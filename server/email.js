import nodemailer from 'nodemailer';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Automatically load .env if present
try {
  process.loadEnvFile(join(__dirname, '..', '.env'));
} catch (e) {
  // .env file not present or already loaded
}

let cachedTransporter = null;

export async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  let smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  let smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || '').trim();

  // If using Gmail without custom host, remove spaces from 16-character Google App Password (e.g. 'abcd efgh ijkl mnop')
  if (!process.env.SMTP_HOST && smtpPass && smtpPass.length >= 16) {
    smtpPass = smtpPass.replace(/\s+/g, '');
  }

  // 1. If user provided real SMTP or Gmail credentials in .env
  if (smtpUser && smtpPass) {
    const isBrevo = smtpPass.startsWith('xsmtpsib-') || process.env.SMTP_HOST?.includes('brevo');
    const smtpHost = process.env.SMTP_HOST || (isBrevo ? 'smtp-relay.brevo.com' : null);
    const smtpPort = Number(process.env.SMTP_PORT) || 587;

    console.log(`[Email Service] Initializing live SMTP (${isBrevo ? 'Brevo' : smtpHost || 'Gmail'}) with user: ${smtpUser}`);

    if (smtpHost) {
      cachedTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Default to Gmail service
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return cachedTransporter;
  }

  // 2. If Resend API key is present
  if (process.env.RESEND_API_KEY) {
    console.log('[Email Service] Resend API configured');
    return { isResend: true, apiKey: process.env.RESEND_API_KEY };
  }

  // 3. Fallback: Automatically generate an Ethereal test inbox so emails are genuinely sent and viewable
  console.log('[Email Service] No personal SMTP credentials found in .env. Creating test mailer...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[Email Service] Created test email sender: ${testAccount.user}`);
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedTransporter.isEthereal = true;
    return cachedTransporter;
  } catch (err) {
    console.warn('[Email Service] Could not create test mailer:', err.message);
    return null;
  }
}

export function buildVerificationHtml(name, code, email) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekend Quest Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF5E9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #16213E;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBF5E9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(22, 33, 62, 0.06); border: 1px solid rgba(22, 33, 62, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; width: 56px; height: 56px; background-color: #FF6A5B; border-radius: 16px; line-height: 56px; text-align: center; font-size: 28px; margin-bottom: 16px;">
                ☀️
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #16213E; letter-spacing: -0.5px;">
                Weekend Quest
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #FF6A5B;">
                Make this weekend count
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 24px 36px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #16213E;">
                Verify your email address
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: rgba(22, 33, 62, 0.7);">
                Hi ${name || 'there'}! Use the 6-digit confirmation code below to activate your account for <strong>${email}</strong>.
              </p>

              <!-- OTP Code Box -->
              <div style="background-color: #FFF3F0; border: 2px dashed #FF6A5B; border-radius: 18px; padding: 22px 10px; margin: 0 auto 24px auto; max-width: 340px;">
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #FF6A5B; font-family: monospace; display: inline-block; padding-left: 8px;">
                  ${code}
                </span>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: rgba(22, 33, 62, 0.5);">
                ⏱️ This code expires in <strong>10 minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(22, 33, 62, 0.5);">
                If you didn’t request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F4EC; padding: 20px 36px; text-align: center; border-top: 1px solid rgba(22, 33, 62, 0.06);">
              <p style="margin: 0; font-size: 11px; color: rgba(22, 33, 62, 0.5);">
                Lock plans by Thursday night — Saturday mornings are for adventures.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendEmailGeneric({ to, subject, text, html }) {
  const transporter = await getTransporter();

  // If using Resend API
  if (transporter && transporter.isResend) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${transporter.apiKey}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Weekend Quest <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('[Email Service] Resend email dispatched successfully:', data.id);
        return { success: true, messageId: data.id, provider: 'resend', realSent: true };
      }
      console.warn('[Email Service] Resend error:', data);
    } catch (err) {
      console.warn('[Email Service] Resend request failed:', err.message);
    }
  }

  // If using standard Nodemailer transporter (Gmail, custom SMTP, or test account)
  if (transporter && transporter.sendMail) {
    try {
      const rawFrom = (process.env.SMTP_FROM || process.env.GMAIL_USER || 'weekendquestverify@gmail.com').trim();
      const fromEmail = rawFrom.includes('<') ? rawFrom.match(/<([^>]+)>/)?.[1] || rawFrom : rawFrom;
      const fromAddress = `"Weekend Quest" <${fromEmail}>`;
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });

      let previewUrl = null;
      if (transporter.isEthereal) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Email Service] 📬 View delivered test email in browser: ${previewUrl}`);
      } else {
        console.log(`[Email Service] 🚀 Real email delivered to ${to} (Message ID: ${info.messageId})`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        realSent: !transporter.isEthereal,
      };
    } catch (err) {
      console.error('[Email Service] Failed to send email via SMTP:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'No email transport configured' };
}

export async function sendVerificationEmail({ to, name, code }) {
  console.log(`[Email Service] Sending verification code ${code} to ${to}...`);
  return sendEmailGeneric({
    to,
    subject: `${code} is your Weekend Quest verification code`,
    text: `Welcome to Weekend Quest! Your 6-digit verification code is: ${code}. It expires in 10 minutes.`,
    html: buildVerificationHtml(name, code, to),
  });
}

export function buildPasswordResetHtml(name, code) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset Your Weekend Quest Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF5E9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #16213E;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(22, 33, 62, 0.06); border: 1px solid rgba(22, 33, 62, 0.08);">
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; width: 56px; height: 56px; background-color: #FF6A5B; border-radius: 16px; line-height: 56px; text-align: center; font-size: 28px; margin-bottom: 16px;">
                🔐
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #16213E;">Weekend Quest</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #FF6A5B;">Password Reset Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 36px 24px 36px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #16213E;">Reset your password</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: rgba(22, 33, 62, 0.7);">
                Hi ${name || 'there'}! Use the 6-digit security code below to choose a new password for your Weekend Quest account:
              </p>
              <div style="background-color: #FFF3F0; border: 2px dashed #FF6A5B; border-radius: 18px; padding: 22px 10px; margin: 0 auto 24px auto; max-width: 340px;">
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #FF6A5B; font-family: monospace; display: inline-block; padding-left: 8px;">
                  ${code}
                </span>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: rgba(22, 33, 62, 0.5);">⏱️ This code expires in <strong>10 minutes</strong>.</p>
              <p style="margin: 0; font-size: 12px; color: rgba(22, 33, 62, 0.5);">If you didn't ask to reset your password, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendPasswordResetEmail({ to, name, code }) {
  console.log(`[Email Service] Sending password reset code to ${to}...`);
  return sendEmailGeneric({
    to,
    subject: `${code} is your Weekend Quest password reset code`,
    text: `Your Weekend Quest password reset code is: ${code}. It expires in 10 minutes.`,
    html: buildPasswordResetHtml(name, code),
  });
}

export function buildInvitationHtml({ inviterName, groupName, groupEmoji, joinCode, appUrl }) {
  const url = `${appUrl || 'http://localhost:5173'}?join=${encodeURIComponent(joinCode)}`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Circle Invitation - Weekend Quest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF5E9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #16213E;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBF5E9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(22, 33, 62, 0.06); border: 1px solid rgba(22, 33, 62, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 16px 36px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #FFF3F0; border-radius: 20px; line-height: 64px; text-align: center; font-size: 34px; margin-bottom: 16px;">
                ${groupEmoji || '🌮'}
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #16213E; letter-spacing: -0.5px;">
                You're Invited!
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #FF6A5B;">
                Weekend Quest Circle
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 28px 36px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #16213E;">
                Join "${groupName}"
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: rgba(22, 33, 62, 0.75);">
                <strong>${inviterName || 'A friend'}</strong> invited you to plan and vote on upcoming weekend quests together in <strong>${groupName}</strong>.
              </p>

              <!-- Join Code Badge -->
              <div style="background-color: #FFF3F0; border: 2px dashed #FF6A5B; border-radius: 18px; padding: 18px 12px; margin: 0 auto 24px auto; max-width: 320px;">
                <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px; color: #FF6A5B;">
                  Your Circle Join Code
                </p>
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #16213E; font-family: monospace; display: inline-block;">
                  ${joinCode}
                </span>
              </div>

              <!-- Action Button -->
              <div style="margin-bottom: 24px;">
                <a href="${url}" style="display: inline-block; background-color: #FF6A5B; color: #FFFFFF; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 16px; box-shadow: 0 4px 14px rgba(255,106,91,0.35);">
                  Accept Invitation & Join Circle &rarr;
                </a>
              </div>

              <!-- Manual Steps -->
              <div style="background-color: #F8F4EC; border-radius: 14px; padding: 14px 18px; text-align: left; margin: 0 auto; max-width: 380px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #16213E;">
                  Already have Weekend Quest open?
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6; color: rgba(22,33,62,0.7);">
                  <li>Go to <strong>Circles</strong> in the sidebar</li>
                  <li>Click <strong>Join with Code</strong></li>
                  <li>Enter code <strong>${joinCode}</strong></li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- Footer with deliverability hint -->
          <tr>
            <td style="background-color: #F8F4EC; padding: 20px 36px; text-align: center; border-top: 1px solid rgba(22, 33, 62, 0.06);">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: rgba(22, 33, 62, 0.55);">
                📬 Tip: If this email landed in your Spam or Promotions folder, mark it as <strong>Not Spam</strong> or star it so you never miss a weekend plan.
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(22, 33, 62, 0.45);">
                Weekend Quest &middot; Lock plans by Thursday night, adventures on Saturday.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendGroupInvitationEmail({ to, inviterName, groupName, groupEmoji, joinCode, appUrl }) {
  console.log(`[Email Service] Sending group invitation to ${to} for "${groupName}" (code: ${joinCode})...`);
  const safeInviter = inviterName || 'A friend';
  const safeGroup = groupName || 'Weekend Crew';
  const safeCode = joinCode || 'WQ-JOIN';
  const url = `${appUrl || 'http://localhost:5173'}?join=${encodeURIComponent(safeCode)}`;

  const textBody = `
Hi there!

${safeInviter} has invited you to join "${safeGroup}" on Weekend Quest.

Your Circle Join Code:
${safeCode}

How to join:
1. Open Weekend Quest: ${appUrl || 'http://localhost:5173'}
2. Click "Circles" in the menu and tap "Join with Code"
3. Enter code: ${safeCode}

Or click this link to join directly:
${url}

Lock plans by Thursday night & make this weekend count!
Weekend Quest
`.trim();

  return sendEmailGeneric({
    to,
    subject: `[Weekend Quest] ${safeInviter} invited you to "${safeGroup}" (Code: ${safeCode})`,
    text: textBody,
    html: buildInvitationHtml({ inviterName: safeInviter, groupName: safeGroup, groupEmoji, joinCode: safeCode, appUrl }),
  });
}

export function buildThursdayReminderHtml({ recipientName, groupName, eventTitle, dateLine, appUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Thursday Lock-In Reminder: Weekend Quest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF5E9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #16213E;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(22, 33, 62, 0.06); border: 1px solid rgba(22, 33, 62, 0.08);">
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; width: 56px; height: 56px; background-color: #A8CF2E; border-radius: 16px; line-height: 56px; text-align: center; font-size: 28px; margin-bottom: 16px;">
                ⏰
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #16213E;">Thursday Lock-In Alert</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #A8CF2E;">Lock Plans By Midnight</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 36px 24px 36px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #16213E;">
                Are you in for ${eventTitle}?
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: rgba(22, 33, 62, 0.75);">
                Hi ${recipientName || 'there'}! The circle <strong>"${groupName}"</strong> is locking plans for this weekend (${dateLine || 'This Weekend'}). Confirm your RSVP so the squad knows who to count on!
              </p>

              <a href="${appUrl || 'http://localhost:5173'}" style="display: inline-block; background-color: #FF6A5B; color: #FFFFFF; font-size: 15px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 16px; box-shadow: 0 4px 14px rgba(255,106,91,0.35);">
                View Quest & Confirm RSVP →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendThursdayReminderEmail({ to, recipientName, groupName, eventTitle, dateLine, appUrl }) {
  console.log(`[Email Service] Sending Thursday lock reminder to ${to} for "${eventTitle}"...`);
  return sendEmailGeneric({
    to,
    subject: `⏰ Thursday Lock-in: Confirm plans for "${eventTitle}"!`,
    text: `Hi ${recipientName || 'there'}! Confirm your RSVP for ${eventTitle} (${groupName}) before Thursday midnight!`,
    html: buildThursdayReminderHtml({ recipientName, groupName, eventTitle, dateLine, appUrl }),
  });
}

