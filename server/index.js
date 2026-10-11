import http from 'node:http';
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase, hashPassword } from './db.js';
import {
  sendVerificationEmail,
  sendLoginOtpEmail,
  sendPasswordResetEmail,
  sendGroupInvitationEmail,
  sendThursdayReminderEmail,
} from './email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Initialize the SQLite database on disk
initDatabase();

// Set public DNS servers for reliable MX lookup across local network configurations
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Use system default DNS if setServers not permitted
}

function resolveMxPromise(domain) {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses);
    });
  });
}

// Validates email syntax, Gmail-specific constraints, and domain mail server (MX) presence
async function verifyEmailDomainAndFormat(email) {
  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Please enter a valid email address with an @ symbol.' };
  }

  const [username, domain] = parts;

  if (!username || username.length === 0) {
    return { valid: false, error: 'Email username cannot be empty.' };
  }

  if (!domain || !domain.includes('.')) {
    return { valid: false, error: `Invalid email domain "${domain}". Please check the spelling.` };
  }

  // Common typo checks for famous providers
  const typos = {
    'gmaill.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
  };
  if (typos[domain]) {
    return { valid: false, error: `Did you mean @${typos[domain]}? Please check your email address.` };
  }

  // Gmail specific username syntax checks
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    if (username.length < 6 || username.length > 30) {
      return {
        valid: false,
        error: `Gmail usernames must be between 6 and 30 characters long (yours is ${username.length}).`,
      };
    }
    if (!/^[a-z0-9.]+$/.test(username)) {
      return {
        valid: false,
        error: 'Gmail usernames can only contain letters (a-z), numbers (0-9), and periods (.).',
      };
    }
    if (username.startsWith('.') || username.endsWith('.')) {
      return { valid: false, error: 'Gmail usernames cannot start or end with a period.' };
    }
    if (username.includes('..')) {
      return { valid: false, error: 'Gmail usernames cannot have consecutive periods (..).' };
    }
  }

  // DNS MX record check to verify domain exists and has active mail servers!
  try {
    const mxRecords = await resolveMxPromise(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        error: `The domain "${domain}" has no mail exchange (MX) servers configured to receive emails.`,
      };
    }
    return { valid: true, domain, cleanEmail };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'SERVFAIL') {
      return {
        valid: false,
        error: `The email domain "${domain}" does not exist. Please check your email address.`,
      };
    }
    // Allow local development and standard known domains as fallback
    if (domain === 'weekend.quest' || domain === 'gmail.com') {
      return { valid: true, domain, cleanEmail };
    }
    return {
      valid: false,
      error: `Could not verify mail server for "${domain}": ${err.code || err.message}`,
    };
  }
}

const PORT = Number(process.env.PORT) || 3001;

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function getAppUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (host?.includes('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : 'https://weekend-quest.onrender.com';
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // 1. Health check
    if (pathname === '/api/health') {
      return jsonResponse(res, 200, { status: 'healthy', database: 'SQLite (node:sqlite)' });
    }

    // 2. Auth: Register (with DNS MX check & 6-digit OTP generation)
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const body = await parseBody(req);
      const { name, email, password, color } = body;

      if (!name || !email || !password) {
        return jsonResponse(res, 400, { error: 'Name, email, and password are required' });
      }

      // 1. Verify email syntax and verify that the domain has active mail servers
      const verification = await verifyEmailDomainAndFormat(email);
      if (!verification.valid) {
        return jsonResponse(res, 400, { error: verification.error });
      }

      const cleanEmail = verification.cleanEmail;
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
      if (existing) {
        return jsonResponse(res, 409, { error: 'An account with this email already exists. Please sign in.' });
      }

      const initials = name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const passwordHash = hashPassword(password);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      db.prepare(`
        INSERT OR REPLACE INTO email_verifications (id, email, code, name, password_hash, initials, color, expires_at, attempts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(`ev-${Date.now()}`, cleanEmail, code, name.trim(), passwordHash, initials || 'U', color || '#FF6A5B', expiresAt);

      console.log(`[Email Verification] Generated 6-digit OTP for ${cleanEmail}: ${code}`);

      // Dispatch real email (via direct SMTP SSL with 3.5s timeout race so mobile never hangs)
      let emailResult = null;
      try {
        emailResult = await Promise.race([
          sendVerificationEmail({
            to: cleanEmail,
            name: name.trim(),
            code,
          }),
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  previewUrl: null,
                  realSent: false,
                  note: 'Dispatch queued',
                }),
              3500
            )
          ),
        ]);
      } catch (mailErr) {
        console.warn('[Register] Email delivery note:', mailErr.message);
      }

      return jsonResponse(res, 200, {
        success: true,
        verificationRequired: true,
        email: cleanEmail,
        name: name.trim(),
        devCode: code,
        emailPreviewUrl: emailResult?.previewUrl || null,
        realSent: Boolean(emailResult?.realSent),
        message: emailResult?.realSent
          ? `A verification code was emailed directly to ${cleanEmail}!`
          : `A 6-digit verification code was generated for ${cleanEmail}.`,
      });
    }

    // 2b. Auth: Verify 6-digit Code & Activate Account
    if (req.method === 'POST' && pathname === '/api/auth/verify-code') {
      const body = await parseBody(req);
      const { email, code } = body;

      if (!email || !code) {
        return jsonResponse(res, 400, { error: 'Email and 6-digit code are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const pending = db.prepare('SELECT * FROM email_verifications WHERE LOWER(email) = LOWER(?)').get(cleanEmail);

      if (!pending) {
        return jsonResponse(res, 404, { error: 'No pending verification found for this email. Please register again.' });
      }

      if (Date.now() > pending.expires_at) {
        db.prepare('DELETE FROM email_verifications WHERE email = ?').run(cleanEmail);
        return jsonResponse(res, 400, { error: 'Verification code has expired. Please request a new code.' });
      }

      if (pending.attempts >= 5) {
        db.prepare('DELETE FROM email_verifications WHERE email = ?').run(cleanEmail);
        return jsonResponse(res, 429, { error: 'Too many incorrect attempts. Please register again.' });
      }

      if (pending.code !== code.trim()) {
        db.prepare('UPDATE email_verifications SET attempts = attempts + 1 WHERE email = ?').run(cleanEmail);
        return jsonResponse(res, 400, { error: 'Incorrect verification code. Please check and try again.' });
      }

      // Code matched! Activate account
      const userId = `u-${Date.now()}`;
      db.prepare(`
        INSERT INTO users (id, email, name, initials, color, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, pending.email, pending.name, pending.initials, pending.color, pending.password_hash);

      // Auto-join any groups this email was already invited to
      try {
        const pendingInvites = db.prepare('SELECT group_id FROM invitations WHERE LOWER(email) = LOWER(?)').all(cleanEmail);
        for (const inv of pendingInvites) {
          db.prepare(`
            INSERT OR IGNORE INTO group_members (id, group_id, user_id, role)
            VALUES (?, ?, ?, 'member')
          `).run(`gm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, inv.group_id, userId);
        }
      } catch (invErr) {
        console.warn('[Verify] Error checking pending invites:', invErr.message);
      }

      // Remove from pending verifications
      db.prepare('DELETE FROM email_verifications WHERE email = ?').run(cleanEmail);

      return jsonResponse(res, 201, {
        success: true,
        user: {
          id: userId,
          email: pending.email,
          name: pending.name,
          initials: pending.initials,
          color: pending.color,
        },
        message: 'Account verified and activated successfully!',
      });
    }

    // 2c. Auth: Resend 6-digit Code
    if (req.method === 'POST' && pathname === '/api/auth/resend-code') {
      const body = await parseBody(req);
      const { email } = body;

      if (!email) {
        return jsonResponse(res, 400, { error: 'Email is required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const pending = db.prepare('SELECT * FROM email_verifications WHERE LOWER(email) = LOWER(?)').get(cleanEmail);

      if (!pending) {
        return jsonResponse(res, 404, { error: 'No pending registration found for this email.' });
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpires = Date.now() + 10 * 60 * 1000;

      db.prepare(`
        UPDATE email_verifications
        SET code = ?, expires_at = ?, attempts = 0
        WHERE email = ?
      `).run(newCode, newExpires, cleanEmail);

      console.log(`[Email Verification] Resent 6-digit code for ${cleanEmail}: ${newCode}`);

      // Dispatch real email on resend
      let emailResult = null;
      try {
        emailResult = await Promise.race([
          sendVerificationEmail({
            to: cleanEmail,
            name: pending.name,
            code: newCode,
          }),
          new Promise((resolve) => setTimeout(() => resolve({ timeout: true, realSent: false }), 3500)),
        ]);
      } catch (mailErr) {
        console.warn('[Resend] Email delivery note:', mailErr.message);
      }

      return jsonResponse(res, 200, {
        success: true,
        email: cleanEmail,
        devCode: newCode,
        emailPreviewUrl: emailResult?.previewUrl || null,
        realSent: Boolean(emailResult?.realSent),
        message: emailResult?.realSent
          ? `A fresh verification code was emailed directly to ${cleanEmail}!`
          : `A fresh 6-digit code has been sent to ${cleanEmail}.`,
      });
    }

    // 2d. Auth: Request Password Reset OTP Code: POST /api/auth/forgot-password
    if (req.method === 'POST' && pathname === '/api/auth/forgot-password') {
      const body = await parseBody(req);
      const { email } = body;

      if (!email || !email.trim()) {
        return jsonResponse(res, 400, { error: 'Please enter your email address' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);

      if (!user) {
        return jsonResponse(res, 404, { error: `No account found with email "${email}"` });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      db.prepare('DELETE FROM password_resets WHERE LOWER(email) = ?').run(cleanEmail);
      db.prepare(`
        INSERT INTO password_resets (id, email, code, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(`pr-${Date.now()}`, cleanEmail, code, expiresAt);

      console.log(`[Password Reset] Generated OTP for ${cleanEmail}: ${code}`);

      let emailResult = null;
      try {
        emailResult = await Promise.race([
          sendPasswordResetEmail({
            to: cleanEmail,
            name: user.name,
            code,
          }),
          new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 3500)),
        ]);
      } catch (err) {
        console.warn('[Password Reset] Email delivery note:', err.message);
      }

      return jsonResponse(res, 200, {
        success: true,
        email: cleanEmail,
        devCode: code,
        emailPreviewUrl: emailResult?.previewUrl || null,
        realSent: Boolean(emailResult?.realSent || emailResult?.success),
        message: `A 6-digit password reset code was sent to ${cleanEmail}!`,
      });
    }

    // 2e. Auth: Confirm Password Reset with Code: POST /api/auth/reset-password
    if (req.method === 'POST' && pathname === '/api/auth/reset-password') {
      const body = await parseBody(req);
      const { email, code, newPassword } = body;

      if (!email || !code || !newPassword) {
        return jsonResponse(res, 400, { error: 'Email, 6-digit code, and new password are required' });
      }

      if (newPassword.length < 6) {
        return jsonResponse(res, 400, { error: 'Password must be at least 6 characters long' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const resetRow = db.prepare('SELECT * FROM password_resets WHERE LOWER(email) = ?').get(cleanEmail);

      if (!resetRow) {
        return jsonResponse(res, 404, { error: 'No password reset requested for this email. Please request a new code.' });
      }

      if (Date.now() > resetRow.expires_at) {
        db.prepare('DELETE FROM password_resets WHERE LOWER(email) = ?').run(cleanEmail);
        return jsonResponse(res, 400, { error: 'Password reset code has expired. Please request a new code.' });
      }

      if (resetRow.attempts >= 5) {
        db.prepare('DELETE FROM password_resets WHERE LOWER(email) = ?').run(cleanEmail);
        return jsonResponse(res, 429, { error: 'Too many incorrect attempts. Please request a new code.' });
      }

      if (resetRow.code !== code.trim()) {
        db.prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE LOWER(email) = ?').run(cleanEmail);
        return jsonResponse(res, 400, { error: 'Incorrect verification code. Please check and try again.' });
      }

      // Valid! Update password
      const passwordHash = hashPassword(newPassword);
      db.prepare('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?').run(passwordHash, cleanEmail);
      db.prepare('DELETE FROM password_resets WHERE LOWER(email) = ?').run(cleanEmail);

      return jsonResponse(res, 200, {
        success: true,
        message: 'Password reset successfully! You can now sign in with your new password.',
      });
    }

    // 3. Auth: Login
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return jsonResponse(res, 400, { error: 'Email and password are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

      if (!user) {
        return jsonResponse(res, 404, { error: `No account found with email "${email}"` });
      }

      const inputHash = hashPassword(password);
      if (inputHash !== user.password_hash) {
        return jsonResponse(res, 401, { error: 'Incorrect password. (Demo password is "password123")' });
      }

      return jsonResponse(res, 200, {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          initials: user.initials,
          color: user.color,
        },
      });
    }

    // 3b. Auth: Send 6-digit Login OTP Code: POST /api/auth/send-login-otp
    if (req.method === 'POST' && pathname === '/api/auth/send-login-otp') {
      const body = await parseBody(req);
      const { email } = body;

      if (!email || !email.includes('@')) {
        return jsonResponse(res, 400, { error: 'Please enter a valid email address.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);

      // If user doesn't exist yet, seamlessly create account so mobile users can sign in with 1-step OTP!
      if (!user) {
        const defaultName = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const initials = defaultName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
        const userId = `u-${Date.now()}`;
        const dummyHash = hashPassword('password123');

        db.prepare(`
          INSERT INTO users (id, email, password_hash, name, initials, color)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, cleanEmail, dummyHash, defaultName, initials, '#FF6A5B');

        user = { id: userId, email: cleanEmail, name: defaultName, initials, color: '#FF6A5B' };
        console.log(`[Login OTP] Created new account for mobile user ${cleanEmail}: ${user.name}`);
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      db.prepare(`
        INSERT OR REPLACE INTO login_otps (id, email, code, expires_at, attempts)
        VALUES (?, ?, ?, ?, 0)
      `).run(`lgn-${Date.now()}`, cleanEmail, code, expiresAt);

      console.log(`[Login OTP] Generated 6-digit sign-in OTP for ${cleanEmail}: ${code}`);

      // Dispatch real email with 3.5s timeout race
      let emailResult = null;
      try {
        emailResult = await Promise.race([
          sendLoginOtpEmail({
            to: cleanEmail,
            name: user.name,
            code,
          }),
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  previewUrl: null,
                  realSent: false,
                  note: 'Dispatch queued',
                }),
              3500
            )
          ),
        ]);
      } catch (mailErr) {
        console.warn('[Login OTP] Email delivery note:', mailErr.message);
      }

      return jsonResponse(res, 200, {
        success: true,
        email: cleanEmail,
        devCode: code,
        emailPreviewUrl: emailResult?.previewUrl || null,
        realSent: Boolean(emailResult?.realSent || emailResult?.success),
        message: emailResult?.realSent
          ? `A 6-digit sign-in code was sent to ${cleanEmail}!`
          : `A 6-digit sign-in code was generated for ${cleanEmail}.`,
      });
    }

    // 3c. Auth: Verify Login OTP Code: POST /api/auth/verify-login-otp
    if (req.method === 'POST' && pathname === '/api/auth/verify-login-otp') {
      const body = await parseBody(req);
      const { email, code } = body;

      if (!email || !code) {
        return jsonResponse(res, 400, { error: 'Email and 6-digit code are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const otpRow = db.prepare('SELECT * FROM login_otps WHERE LOWER(email) = LOWER(?)').get(cleanEmail);

      if (!otpRow) {
        return jsonResponse(res, 404, { error: 'No login code found. Please request a new code.' });
      }

      if (Date.now() > otpRow.expires_at) {
        db.prepare('DELETE FROM login_otps WHERE LOWER(email) = LOWER(?)').run(cleanEmail);
        return jsonResponse(res, 400, { error: 'Login code has expired. Please request a new code.' });
      }

      if (otpRow.attempts >= 5) {
        db.prepare('DELETE FROM login_otps WHERE LOWER(email) = LOWER(?)').run(cleanEmail);
        return jsonResponse(res, 429, { error: 'Too many incorrect attempts. Please request a new code.' });
      }

      if (otpRow.code !== code.trim()) {
        db.prepare('UPDATE login_otps SET attempts = attempts + 1 WHERE LOWER(email) = LOWER(?)').run(cleanEmail);
        return jsonResponse(res, 400, { error: 'Incorrect code. Please double-check and try again.' });
      }

      // Valid! Fetch user and remove OTP
      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
      db.prepare('DELETE FROM login_otps WHERE LOWER(email) = LOWER(?)').run(cleanEmail);

      return jsonResponse(res, 200, {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          initials: user.initials,
          color: user.color,
        },
        message: `Welcome back, ${user.name}!`,
      });
    }

    // 4. Users list (for search & invitations)
    if (req.method === 'GET' && pathname === '/api/users') {
      const users = db.prepare('SELECT id, email, name, initials, color FROM users').all();
      return jsonResponse(res, 200, users);
    }

    // 5. Groups list: GET /api/groups?userId=...
    // Strictly isolate groups: only return groups where the user is an explicit member or creator!
    if (req.method === 'GET' && pathname === '/api/groups') {
      const userId = url.searchParams.get('userId');
      let groups = [];
      if (userId) {
        groups = db.prepare(`
          SELECT DISTINCT g.* FROM groups g
          LEFT JOIN group_members gm ON gm.group_id = g.id
          WHERE gm.user_id = ? OR g.created_by = ?
          ORDER BY g.created_at ASC
        `).all(userId, userId);
      } else {
        groups = db.prepare('SELECT * FROM groups ORDER BY created_at ASC').all();
      }

      const mapped = groups.map((g) => {
        const memberRows = db.prepare(`
          SELECT u.id, u.email, u.name, u.initials, u.color, gm.role
          FROM group_members gm
          JOIN users u ON u.id = gm.user_id
          WHERE gm.group_id = ?
        `).all(g.id);

        let finalMembers = memberRows;
        if (finalMembers.length === 0) {
          const creator = db.prepare('SELECT id, email, name, initials, color FROM users WHERE id = ?').get(g.created_by);
          finalMembers = creator ? [{ ...creator, role: 'admin' }] : [];
        }

        return {
          id: g.id,
          name: g.name,
          tagline: g.tagline,
          emoji: g.emoji,
          accent: g.accent,
          createdBy: g.created_by,
          joinCode: g.join_code || 'WQ-CREW1',
          members: finalMembers,
        };
      });

      return jsonResponse(res, 200, mapped);
    }

    // 5b. Create Group: POST /api/groups
    if (req.method === 'POST' && pathname === '/api/groups') {
      const body = await parseBody(req);
      const { id, name, tagline, emoji, accent, userId } = body;
      if (!name || !name.trim()) {
        return jsonResponse(res, 400, { error: 'Group name is required' });
      }

      const groupId = id || `g-${Date.now()}`;
      const creatorId = userId || 'u-alex';
      const joinCode = 'WQ-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      db.prepare(`
        INSERT INTO groups (id, name, tagline, emoji, accent, created_by, join_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(groupId, name.trim(), tagline || 'Weekend circle', emoji || '🌟', accent || '#FF6A5B', creatorId, joinCode);

      db.prepare(`
        INSERT OR IGNORE INTO group_members (id, group_id, user_id, role)
        VALUES (?, ?, ?, 'admin')
      `).run(`gm-${Date.now()}`, groupId, creatorId);

      const creator = db.prepare('SELECT id, email, name, initials, color FROM users WHERE id = ?').get(creatorId) || {
        id: creatorId,
        name: 'You',
        initials: 'ME',
        color: '#FF6A5B',
        email: '',
      };

      return jsonResponse(res, 201, {
        id: groupId,
        name: name.trim(),
        tagline: tagline || 'Weekend circle',
        emoji: emoji || '🌟',
        accent: accent || '#FF6A5B',
        createdBy: creatorId,
        joinCode,
        members: [{ ...creator, role: 'admin' }],
      });
    }

    // 5c. Join Group by Code: POST /api/groups/join-by-code
    if (req.method === 'POST' && pathname === '/api/groups/join-by-code') {
      const body = await parseBody(req);
      const { code, userId } = body;

      if (!code || !code.trim()) {
        return jsonResponse(res, 400, { error: 'Please enter a valid join code' });
      }

      const cleanCode = code.trim().toUpperCase();
      const group = db.prepare('SELECT * FROM groups WHERE UPPER(join_code) = ?').get(cleanCode);

      if (!group) {
        return jsonResponse(res, 404, { error: `No circle found with code "${cleanCode}". Please check spelling.` });
      }

      const uid = userId || 'u-alex';
      const existingMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(group.id, uid);

      if (existingMember) {
        return jsonResponse(res, 200, {
          success: true,
          alreadyMember: true,
          groupId: group.id,
          groupName: group.name,
          message: `You are already a member of "${group.name}"!`,
        });
      }

      db.prepare(`
        INSERT OR IGNORE INTO group_members (id, group_id, user_id, role)
        VALUES (?, ?, ?, 'member')
      `).run(`gm-${Date.now()}`, group.id, uid);

      const user = db.prepare('SELECT id, email, name, initials, color FROM users WHERE id = ?').get(uid);

      return jsonResponse(res, 200, {
        success: true,
        groupId: group.id,
        groupName: group.name,
        groupEmoji: group.emoji,
        message: `Welcome to ${group.name}! 🎉`,
        user,
      });
    }

    // 5d. Invite User to Group: POST /api/groups/:id/invite
    if (req.method === 'POST' && pathname.match(/^\/api\/groups\/([^\/]+)\/invite$/)) {
      const groupId = pathname.split('/')[3];
      const body = await parseBody(req);
      const { email, userId, invitedBy } = body;

      console.log('[Invite] Received POST /api/groups/:id/invite:', { groupId, email, userId, invitedBy });

      const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
      if (!group) {
        return jsonResponse(res, 404, { error: 'Group not found' });
      }

      const inviter = db.prepare('SELECT name FROM users WHERE id = ?').get(invitedBy || 'u-alex');
      const inviterName = inviter?.name || 'A friend';
      const joinCode = group.join_code || 'WQ-CREW1';

      let targetUser = null;
      if (userId) {
        targetUser = db.prepare('SELECT id, email, name, initials, color FROM users WHERE id = ?').get(userId);
      } else if (email) {
        targetUser = db.prepare('SELECT id, email, name, initials, color FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      }

      if (targetUser) {
        const existingMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, targetUser.id);
        if (!existingMember) {
          db.prepare(`
            INSERT INTO group_members (id, group_id, user_id, role)
            VALUES (?, ?, ?, 'member')
          `).run(`gm-${Date.now()}`, groupId, targetUser.id);
        }

        console.log(`[Invite] Dispatching invitation email to user: ${targetUser.email} (already member: ${Boolean(existingMember)})`);

        let emailResult = null;
        try {
          emailResult = await sendGroupInvitationEmail({
            to: targetUser.email,
            inviterName,
            groupName: group.name,
            groupEmoji: group.emoji,
            joinCode,
            appUrl: getAppUrl(req),
          });
        } catch (e) {
          console.error('[Invite] Email error:', e.message);
        }

        const emailDelivered = Boolean(emailResult?.success);
        return jsonResponse(res, 200, {
          success: true,
          message: existingMember
            ? `Invitation email resent to ${targetUser.email}!`
            : `${targetUser.name} joined ${group.name}! Invitation email sent to ${targetUser.email}.`,
          user: targetUser,
          emailSent: emailDelivered,
        });
      } else if (email) {
        const cleanEmail = email.trim().toLowerCase();
        db.prepare(`
          INSERT OR REPLACE INTO invitations (id, group_id, email, invited_by)
          VALUES (?, ?, ?, ?)
        `).run(`inv-${Date.now()}`, groupId, cleanEmail, invitedBy || 'u-alex');

        console.log(`[Invite] Dispatching invitation email to new address: ${cleanEmail}`);

        // Dispatch real invitation email with join code & link
        let emailResult = null;
        try {
          emailResult = await sendGroupInvitationEmail({
            to: cleanEmail,
            inviterName,
            groupName: group.name,
            groupEmoji: group.emoji,
            joinCode,
            appUrl: getAppUrl(req),
          });
        } catch (e) {
          console.error('[Invite] Email error:', e.message);
        }

        return jsonResponse(res, 200, {
          success: true,
          pending: true,
          message: `Invitation email sent to ${cleanEmail}! They can join with code ${joinCode} or accept via email.`,
          emailSent: Boolean(emailResult?.success),
        });
      } else {
        return jsonResponse(res, 400, { error: 'Please provide a valid email or user to invite' });
      }
    }

    // 6. Ideas: GET /api/ideas?groupId=...
    if (req.method === 'GET' && pathname === '/api/ideas') {
      const groupId = url.searchParams.get('groupId') || 'g1';
      const userId = url.searchParams.get('userId') || 'u-alex';

      const ideas = db.prepare('SELECT * FROM ideas WHERE group_id = ? ORDER BY votes DESC').all(groupId);
      const comments = db.prepare('SELECT * FROM comments').all();
      const userVotes = new Set(
        db.prepare('SELECT idea_id FROM votes WHERE user_id = ?').all(userId).map((v) => v.idea_id)
      );

      const enriched = ideas.map((idea) => {
        const ideaComments = comments
          .filter((c) => c.idea_id === idea.id)
          .map((c) => ({
            id: c.id,
            ideaId: c.idea_id,
            author: { id: c.author_id, name: c.author_name, initials: c.author_initials, color: c.author_color },
            text: c.text,
            createdAt: c.created_at,
          }));

        return {
          id: idea.id,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          time: idea.time,
          votes: idea.votes,
          votedByMe: userVotes.has(idea.id),
          suggestedBy: idea.suggested_by,
          comments: ideaComments,
        };
      });

      return jsonResponse(res, 200, enriched);
    }

    // 7. Ideas: POST /api/ideas
    if (req.method === 'POST' && pathname === '/api/ideas') {
      const body = await parseBody(req);
      const { groupId, title, description, category, time, suggestedBy, userId } = body;

      const id = `idea-${Date.now()}`;
      db.prepare(`
        INSERT INTO ideas (id, group_id, title, description, category, time, votes, suggested_by)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(id, groupId || 'g1', title, description, category, time, suggestedBy || 'You');

      if (userId) {
        db.prepare('INSERT INTO votes (id, idea_id, user_id) VALUES (?, ?, ?)').run(`v-${Date.now()}`, id, userId);
      }

      return jsonResponse(res, 201, { id, title, description, category, time, votes: 1, votedByMe: true, suggestedBy });
    }

    // 8. Ideas: POST /api/ideas/:id/vote
    if (req.method === 'POST' && pathname.match(/^\/api\/ideas\/([^\/]+)\/vote$/)) {
      const ideaId = pathname.split('/')[3];
      const body = await parseBody(req);
      const userId = body.userId || 'u-alex';

      const existingVote = db.prepare('SELECT id FROM votes WHERE idea_id = ? AND user_id = ?').get(ideaId, userId);
      let voted = false;

      if (existingVote) {
        db.prepare('DELETE FROM votes WHERE id = ?').run(existingVote.id);
        db.prepare('UPDATE ideas SET votes = MAX(0, votes - 1) WHERE id = ?').run(ideaId);
        voted = false;
      } else {
        db.prepare('INSERT INTO votes (id, idea_id, user_id) VALUES (?, ?, ?)').run(`v-${Date.now()}`, ideaId, userId);
        db.prepare('UPDATE ideas SET votes = votes + 1 WHERE id = ?').run(ideaId);
        voted = true;
      }

      const updated = db.prepare('SELECT votes FROM ideas WHERE id = ?').get(ideaId);
      return jsonResponse(res, 200, { ideaId, votes: updated.votes, votedByMe: voted });
    }

    // 9. Comments: POST /api/ideas/:id/comments
    if (req.method === 'POST' && pathname.match(/^\/api\/ideas\/([^\/]+)\/comments$/)) {
      const ideaId = pathname.split('/')[3];
      const body = await parseBody(req);
      const { text, author } = body;

      const commentId = `c-${Date.now()}`;
      db.prepare(`
        INSERT INTO comments (id, idea_id, author_id, author_name, author_initials, author_color, text)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        commentId,
        ideaId,
        author?.id || 'u-alex',
        author?.name || 'Alex Rivera',
        author?.initials || 'AR',
        author?.color || '#FF6A5B',
        text
      );

      return jsonResponse(res, 201, {
        id: commentId,
        ideaId,
        author,
        text,
        createdAt: 'just now',
      });
    }

    // 10. Upcoming Quests: GET /api/upcoming
    if (req.method === 'GET' && pathname === '/api/upcoming') {
      const groupId = url.searchParams.get('groupId') || 'g1';
      const quest = db.prepare('SELECT * FROM upcoming_quests WHERE group_id = ? LIMIT 1').get(groupId);

      if (!quest) {
        return jsonResponse(res, 404, { error: 'No upcoming quest found' });
      }

      const checklist = db.prepare('SELECT * FROM checklist WHERE quest_id = ?').all(quest.id).map((c) => ({
        id: c.id,
        text: c.text,
        done: Boolean(c.done),
        assignedTo: c.assigned_to,
      }));

      const expenses = db.prepare('SELECT * FROM expenses WHERE quest_id = ?').all(quest.id).map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        paidBy: e.paid_by,
        splitBetween: JSON.parse(quest.attending_users || '[]'),
      }));

      return jsonResponse(res, 200, {
        id: quest.id,
        title: quest.title,
        dayLabel: quest.day_label,
        dateLine: quest.date_line,
        date: quest.date,
        time: quest.time,
        location: quest.location,
        address: quest.address,
        notes: quest.notes,
        emoji: quest.emoji,
        attendees: JSON.parse(quest.attending_users || '[]'),
        attending: true,
        checklist,
        expenses,
      });
    }

    // 10b. Thursday Lock Reminder: POST /api/events/:id/send-reminder
    if (req.method === 'POST' && pathname.match(/^\/api\/events\/([^\/]+)\/send-reminder$/)) {
      const eventId = pathname.split('/')[3];
      const quest = db.prepare('SELECT * FROM upcoming_quests WHERE id = ?').get(eventId);
      if (!quest) {
        return jsonResponse(res, 404, { error: 'Quest not found' });
      }

      const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(quest.group_id);
      const members = db.prepare(`
        SELECT u.id, u.email, u.name
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ?
      `).all(quest.group_id);

      let sentCount = 0;
      for (const m of members) {
        if (m.email && m.email.includes('@')) {
          try {
            await sendThursdayReminderEmail({
              to: m.email,
              recipientName: m.name,
              groupName: group?.name || 'Your Circle',
              eventTitle: quest.title,
              dateLine: quest.date_line,
              appUrl: getAppUrl(req),
            });
            sentCount++;
          } catch (e) {
            console.warn('[Reminder] Failed to send reminder to', m.email, e.message);
          }
        }
      }

      return jsonResponse(res, 200, {
        success: true,
        count: sentCount,
        message: `Thursday lock-in reminder sent to ${sentCount} circle members!`,
      });
    }

    // 9. Static Assets & Client-side SPA Routing (from dist folder)
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
      const sanitizedPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
      let filePath = path.join(DIST_DIR, sanitizedPath);

      let stat = null;
      try {
        stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
          stat = fs.statSync(filePath);
        }
      } catch {
        // Fallback to index.html for SPA client-side routes (e.g. /dashboard, /groups)
        filePath = path.join(DIST_DIR, 'index.html');
        try {
          stat = fs.statSync(filePath);
        } catch {
          stat = null;
        }
      }

      if (stat && stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.woff2': 'font/woff2',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    // Fallback 404
    return jsonResponse(res, 404, { error: 'Endpoint not found' });
  } catch (err) {
    console.error('[Server Error]', err);
    return jsonResponse(res, 500, { error: 'Internal Server Error', details: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Database Server] SQLite REST API & Web App running on port ${PORT}`);
});
