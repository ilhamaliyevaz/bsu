-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  course INTEGER NOT NULL,
  profile_image TEXT,
  is_banned INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Verification questions table
CREATE TABLE IF NOT EXISTS verification_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL
);

-- Faculty rooms table
CREATE TABLE IF NOT EXISTS faculties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Messages table (for both faculty and private chats)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER,
  faculty_id INTEGER,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (faculty_id) REFERENCES faculties(id)
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id INTEGER NOT NULL,
  blocked_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blocker_id) REFERENCES users(id),
  FOREIGN KEY (blocked_id) REFERENCES users(id),
  UNIQUE(blocker_id, blocked_id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  reported_id INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reported_id) REFERENCES users(id)
);

-- Filter words table (admin managed)
CREATE TABLE IF NOT EXISTS filter_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rules table (admin managed)
CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Topic of the day table (admin managed)
CREATE TABLE IF NOT EXISTS daily_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_faculty ON messages(faculty_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_private ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_expires ON messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);

-- Insert verification questions
INSERT INTO verification_questions (question, correct_answer) VALUES
('Mexanika-riyaziyyat fakültəsi hansı korpusda yerləşir?', '3'),
('Tətbiqi riyaziyyat və kibernetika fakültəsi hansı korpusda yerləşir?', '3'),
('Fizika fakültəsi hansı korpusda yerləşir?', 'əsas'),
('Kimya fakültəsi hansı korpusda yerləşir?', 'əsas'),
('Biologiya fakültəsi hansı korpusda yerləşir?', 'əsas'),
('Ekologiya və torpaqşünaslıq fakültəsi hansı korpusda yerləşir?', 'əsas'),
('Coğrafiya fakültəsi hansı korpusda yerləşir?', 'əsas'),
('Geologiya fakültəsi hansı korpusda yerləşir?', 'əsas'),
('Filologiya fakültəsi hansı korpusda yerləşir?', '1'),
('Tarix fakültəsi hansı korpusda yerləşir?', '3'),
('Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi hansı korpusda yerləşir?', '1'),
('Hüquq fakültəsi hansı korpusda yerləşir?', '1'),
('Jurnalistika fakültəsi hansı korpusda yerləşir?', '2'),
('İnformasiya və sənəd menecmenti fakültəsi hansı korpusda yerləşir?', '2'),
('Şərqşünaslıq fakültəsi hansı korpusda yerləşir?', '2'),
('Sosial elmlər və psixologiya fakültəsi hansı korpusda yerləşir?', '2');

-- Insert 16 faculties
INSERT INTO faculties (name, slug) VALUES
('Mexanika-riyaziyyat fakültəsi', 'mexanika-riyaziyyat'),
('Tətbiqi riyaziyyat və kibernetika fakültəsi', 'tetbiqi-riyaziyyat-kibernetika'),
('Fizika fakültəsi', 'fizika'),
('Kimya fakültəsi', 'kimya'),
('Biologiya fakültəsi', 'biologiya'),
('Ekologiya və torpaqşünaslıq fakültəsi', 'ekologiya-torpaqshunasliq'),
('Coğrafiya fakültəsi', 'cografiya'),
('Geologiya fakültəsi', 'geologiya'),
('Filologiya fakültəsi', 'filologiya'),
('Tarix fakültəsi', 'tarix'),
('Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi', 'beynelxalq-munasibetler-iqtisadiyyat'),
('Hüquq fakültəsi', 'huquq'),
('Jurnalistika fakültəsi', 'jurnalistika'),
('İnformasiya və sənəd menecmenti fakültəsi', 'informasiya-sened-menecmenti'),
('Şərqşünaslıq fakültəsi', 'serqshunasliq'),
('Sosial elmlər və psixologiya fakültəsi', 'sosial-elmler-psixologiya');

-- Insert default admin
-- Password: ursa618 (will be hashed in application)
INSERT INTO users (email, phone, password, full_name, faculty, course, is_admin) 
VALUES ('admin@bsu.edu.az', '+9940000000000', 'ursa618', 'Admin', 'Admin', 0, 1);

-- Insert initial rules
INSERT INTO rules (content) VALUES ('Sayt qaydaları admin tərəfindən əlavə ediləcək.');

-- Insert initial daily topic
INSERT INTO daily_topics (content) VALUES ('Xoş gəlmisiniz! Günün mövzusu admin tərəfindən təyin ediləcək.');
