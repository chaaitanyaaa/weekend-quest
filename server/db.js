import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveDbPath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  if (process.env.VERCEL) {
    const tmpDir = os.tmpdir() || '/tmp';
    const tmpPath = join(tmpDir, 'database.sqlite');
    const sourcePath = join(__dirname, '..', 'database.sqlite');
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
      if (!fs.existsSync(tmpPath) && fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, tmpPath);
        console.log('[Database] Seeded initial database into temp directory from source.');
      }
    } catch (err) {
      console.warn('[Database] Note: Could not copy initial database to temp directory:', err.message);
    }
    return tmpPath;
  }
  return join(__dirname, '..', 'database.sqlite');
}

const DB_PATH = resolveDbPath();

export const db = new DatabaseSync(DB_PATH);

// Helper for hashing passwords
export function hashPassword(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

export function initDatabase() {
  console.log(`[Database] Initializing SQLite database at: ${DB_PATH}`);

  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      color TEXT DEFAULT '#FF6A5B',
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      emoji TEXT DEFAULT '🌮',
      accent TEXT DEFAULT '#FF6A5B',
      created_by TEXT DEFAULT 'u-alex',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Ensure created_by column exists on groups
  try {
    const groupCols = db.prepare('PRAGMA table_info(groups)').all();
    if (!groupCols.some((c) => c.name === 'created_by')) {
      db.exec(`ALTER TABLE groups ADD COLUMN created_by TEXT DEFAULT 'u-alex';`);
    }
    if (!groupCols.some((c) => c.name === 'join_code')) {
      db.exec(`ALTER TABLE groups ADD COLUMN join_code TEXT;`);
    }
  } catch (err) {
    console.warn('[Database] Column migration note:', err.message);
  }

  // Populate any groups with missing join_code
  try {
    const groupsWithoutCode = db.prepare("SELECT id FROM groups WHERE join_code IS NULL OR join_code = ''").all();
    for (const g of groupsWithoutCode) {
      const code = 'WQ-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      db.prepare('UPDATE groups SET join_code = ? WHERE id = ?').run(code, g.id);
    }
  } catch (err) {
    console.warn('[Database] Seed join_code note:', err.message);
  }

  // 3. Group Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      UNIQUE(group_id, user_id)
    );
  `);

  // 3b. Invitations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      email TEXT NOT NULL,
      invited_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, email)
    );
  `);

  // 3c. Email Verifications table (for 6-digit OTP code verification)
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      initials TEXT NOT NULL,
      color TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0
    );
  `);

  // 3d. Password Resets table (for 6-digit OTP password reset)
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0
    );
  `);

  // 3e. Login OTPs table (for 6-digit one-time login code)
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_otps (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0
    );
  `);

  // 4. Ideas table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      time TEXT NOT NULL,
      votes INTEGER DEFAULT 1,
      suggested_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Votes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      UNIQUE(idea_id, user_id)
    );
  `);

  // 6. Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_initials TEXT NOT NULL,
      author_color TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Upcoming Quests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS upcoming_quests (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      day_label TEXT DEFAULT 'Fri',
      date_line TEXT,
      date TEXT,
      time TEXT,
      location TEXT,
      address TEXT,
      notes TEXT,
      emoji TEXT DEFAULT '🍕',
      attending_users TEXT DEFAULT '[]'
    );
  `);

  // 8. Checklist table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist (
      id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      assigned_to TEXT
    );
  `);

  // 9. Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_by TEXT
    );
  `);

  // Seed default users if table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('[Database] Seeding default users...');
    const defaultPassHash = hashPassword('password123');

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, name, initials, color, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('u-alex', 'alex@weekend.quest', 'Alex Rivera', 'AR', '#FF6A5B', defaultPassHash);
    insertUser.run('u-maya', 'maya@weekend.quest', 'Maya Chen', 'MC', '#A8CF2E', defaultPassHash);
    insertUser.run('u-leo', 'leo@weekend.quest', 'Leo Park', 'LP', '#7BCFB8', defaultPassHash);
    insertUser.run('u-priya', 'priya@weekend.quest', 'Priya Rao', 'PR', '#FFB547', defaultPassHash);
    insertUser.run('u-sam', 'sam@weekend.quest', 'Sam Okafor', 'SO', '#9B7BC7', defaultPassHash);
  }

  // Seed default groups if empty
  const groupCount = db.prepare('SELECT COUNT(*) as count FROM groups').get().count;
  if (groupCount === 0) {
    console.log('[Database] Seeding default groups...');
    const insertGroup = db.prepare(`
      INSERT INTO groups (id, name, tagline, emoji, accent, join_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertGroup.run('g1', 'The Saturday Crew', 'Weekend wanderers since 2021', '🌮', '#FF6A5B', 'WQ-CREW1');
    insertGroup.run('g2', 'Brunch Club', 'Sundays are for mimosas', '🥑', '#A8CF2E', 'WQ-BRUNCH');
    insertGroup.run('g3', 'Adventure Squad', 'Hiking, biking, kayaking', '🏔️', '#7BCFB8', 'WQ-ADVENT');
    insertGroup.run('g4', 'Downtown Friends', 'City explorers and foodies', '🌆', '#FFB547', 'WQ-DOWNTN');
  }

  // Seed default group memberships so existing groups are only visible to their members
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM group_members').get().count;
  if (memberCount === 0) {
    console.log('[Database] Seeding default group memberships...');
    const insertMember = db.prepare(`
      INSERT OR IGNORE INTO group_members (id, group_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `);

    // The Saturday Crew (g1): Alex, Maya, Leo, Priya, Sam
    insertMember.run('gm-1', 'g1', 'u-alex', 'admin');
    insertMember.run('gm-2', 'g1', 'u-maya', 'member');
    insertMember.run('gm-3', 'g1', 'u-leo', 'member');
    insertMember.run('gm-4', 'g1', 'u-priya', 'member');
    insertMember.run('gm-5', 'g1', 'u-sam', 'member');

    // Brunch Club (g2): Alex, Maya, Priya, Sam
    insertMember.run('gm-6', 'g2', 'u-alex', 'admin');
    insertMember.run('gm-7', 'g2', 'u-maya', 'member');
    insertMember.run('gm-8', 'g2', 'u-priya', 'member');
    insertMember.run('gm-9', 'g2', 'u-sam', 'member');

    // Adventure Squad (g3): Alex, Leo, Priya
    insertMember.run('gm-10', 'g3', 'u-alex', 'admin');
    insertMember.run('gm-11', 'g3', 'u-leo', 'member');
    insertMember.run('gm-12', 'g3', 'u-priya', 'member');

    // Downtown Friends (g4): Alex, Maya, Leo
    insertMember.run('gm-13', 'g4', 'u-alex', 'admin');
    insertMember.run('gm-14', 'g4', 'u-maya', 'member');
    insertMember.run('gm-15', 'g4', 'u-leo', 'member');
  }

  // Ensure potato@gmail.com (chaitanya) has their created group 'u' strictly associated with their account
  const chaitanyaUser = db.prepare("SELECT id FROM users WHERE email = 'potato@gmail.com'").get();
  if (chaitanyaUser) {
    const chaitanyaGroups = db.prepare("SELECT id FROM groups WHERE created_by = ?").all(chaitanyaUser.id);
    if (chaitanyaGroups.length === 0) {
      const gUId = 'g-chaitanya-u';
      const exists = db.prepare("SELECT id FROM groups WHERE id = ?").get(gUId);
      if (!exists) {
        db.prepare(`
          INSERT INTO groups (id, name, tagline, emoji, accent, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(gUId, 'u', 'Weekend circle', '🎮', '#FF6A5B', chaitanyaUser.id);

        db.prepare(`
          INSERT OR IGNORE INTO group_members (id, group_id, user_id, role)
          VALUES (?, ?, ?, 'admin')
        `).run(`gm-u-${Date.now()}`, gUId, chaitanyaUser.id);
      }
    }
  }

  // Seed default ideas if empty
  const ideaCount = db.prepare('SELECT COUNT(*) as count FROM ideas').get().count;
  if (ideaCount === 0) {
    console.log('[Database] Seeding default quest ideas...');
    const insertIdea = db.prepare(`
      INSERT INTO ideas (id, group_id, title, description, category, time, votes, suggested_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertIdea.run('i1', 'g1', 'Try the new ramen spot', 'That place on 4th everyone’s been posting about. Limited seats.', 'food', 'Fri · 7pm', 4, 'Maya');
    insertIdea.run('i2', 'g1', 'Sunset hike at Eagle Ridge', '2.4-mile loop with a panoramic view at the top. Bring a flashlight.', 'outdoor', 'Sat · 5pm', 6, 'Leo');
    insertIdea.run('i3', 'g1', 'Board game night', 'Catan, Codenames, and the cozy new game Maya picked up.', 'games', 'Sat · 8pm', 3, 'Priya');
    insertIdea.run('i4', 'g1', 'Outdoor movie in the park', 'They’re screening Studio Ghibli under the stars.', 'culture', 'Sun · 8pm', 2, 'Sam');
    insertIdea.run('i5', 'g1', 'Kayak the river', 'Two-hour guided paddle through the marshlands.', 'adventure', 'Sat · 10am', 2, 'Iris');
    insertIdea.run('i6', 'g1', 'Sunday brunch crawl', 'Hit three cafés in one morning. Shareable plates only.', 'food', 'Sun · 11am', 3, 'Sam');
  }

  // Seed default upcoming quest if empty
  const upcomingCount = db.prepare('SELECT COUNT(*) as count FROM upcoming_quests').get().count;
  if (upcomingCount === 0) {
    console.log('[Database] Seeding default upcoming quest...');
    db.prepare(`
      INSERT INTO upcoming_quests (id, group_id, title, day_label, date_line, date, time, location, address, notes, emoji, attending_users)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'u1',
      'g1',
      'Pizza & movie marathon',
      'Fri',
      'Oct 18 · 7:30 PM',
      '2026-10-18',
      '7:30 PM',
      "Leo’s apartment",
      '412 Maple Street, Apt 3B',
      'BYO favorite drink. Watching Spider-Verse back to back!',
      '🍕',
      JSON.stringify(['AR', 'MC', 'LP', 'PR'])
    );

    // Checklist items
    const insertChecklist = db.prepare('INSERT INTO checklist (id, quest_id, text, done, assigned_to) VALUES (?, ?, ?, ?, ?)');
    insertChecklist.run('chk-1', 'u1', 'Order sourdough pizzas from Crust & Co', 1, 'Leo Park');
    insertChecklist.run('chk-2', 'u1', 'Bring portable projector & HDMI cable', 1, 'Maya Chen');
    insertChecklist.run('chk-3', 'u1', 'Pick up ice cream & soda floats', 0, 'Alex Rivera');
    insertChecklist.run('chk-4', 'u1', 'Extra beanbags or floor cushions', 0, 'Priya Rao');

    // Expenses
    const insertExpense = db.prepare('INSERT INTO expenses (id, quest_id, title, amount, paid_by) VALUES (?, ?, ?, ?, ?)');
    insertExpense.run('exp-1', 'u1', 'Pizza party pack (3 large)', 64.50, 'u-leo');
    insertExpense.run('exp-2', 'u1', 'Popcorn & snacks', 18.20, 'u-maya');
  }

  console.log('[Database] SQLite database successfully initialized and verified!');
}
