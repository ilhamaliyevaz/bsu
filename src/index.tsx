import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== HELPER FUNCTIONS ====================

// Simple password hashing (for demo - use bcrypt in production)
function hashPassword(password: string): string {
  return btoa(password) // Base64 encoding (NOT SECURE - use bcrypt in production)
}

function verifyPassword(password: string, hash: string): boolean {
  return btoa(password) === hash
}

// Check if user is blocked by another user
async function isBlocked(db: D1Database, userId: number, targetUserId: number): Promise<boolean> {
  const result = await db.prepare(
    'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?'
  ).bind(targetUserId, userId).first()
  return !!result
}

// Filter message content
async function filterMessage(db: D1Database, content: string): Promise<string> {
  const words = await db.prepare('SELECT word FROM filter_words').all()
  let filtered = content
  for (const row of words.results) {
    const word = row.word as string
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, '***')
  }
  return filtered
}

// Delete messages older than 72 hours
async function cleanupOldMessages(db: D1Database) {
  const cutoffTime = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  await db.prepare('DELETE FROM messages WHERE created_at < ?').bind(cutoffTime).run()
}

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', async (c) => {
  try {
    const { email, phone, password, full_name, faculty, course } = await c.req.json()

    // Validate email domain
    if (!email.endsWith('@bsu.edu.az')) {
      return c.json({ error: 'Email must end with @bsu.edu.az' }, 400)
    }

    // Validate phone format (+994XXXXXXXXXX)
    if (!phone.match(/^\+994\d{9}$/)) {
      return c.json({ error: 'Phone must be in format +994XXXXXXXXX (9 digits after +994)' }, 400)
    }

    // Hash password
    const hashedPassword = hashPassword(password)

    // Insert user
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, phone, password, full_name, faculty, course) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(email, phone, hashedPassword, full_name, faculty, course).run()

    if (!result.success) {
      return c.json({ error: 'User already exists or invalid data' }, 400)
    }

    return c.json({ 
      success: true, 
      userId: result.meta.last_row_id,
      message: 'Registration successful' 
    })
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Get verification questions
app.get('/api/auth/verification-questions', async (c) => {
  try {
    const allQuestions = await c.env.DB.prepare('SELECT * FROM verification_questions').all()
    
    // Shuffle and pick 3 random questions
    const shuffled = allQuestions.results.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 3)
    
    return c.json({ questions: selected })
  } catch (error) {
    return c.json({ error: 'Failed to fetch questions' }, 500)
  }
})

// Verify answers
app.post('/api/auth/verify-answers', async (c) => {
  try {
    const { answers } = await c.req.json() // { questionId: answer }
    
    let correctCount = 0
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = await c.env.DB.prepare(
        'SELECT correct_answer FROM verification_questions WHERE id = ?'
      ).bind(questionId).first()
      
      if (question && question.correct_answer === answer) {
        correctCount++
      }
    }
    
    return c.json({ 
      success: correctCount >= 2,
      correctCount,
      required: 2 
    })
  } catch (error) {
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    if (!verifyPassword(password, user.password as string)) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    if (user.is_banned === 1) {
      return c.json({ error: 'Your account has been banned' }, 403)
    }

    return c.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        faculty: user.faculty,
        course: user.course,
        profile_image: user.profile_image,
        is_admin: user.is_admin
      }
    })
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Admin login
app.post('/api/auth/admin-login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (username === 'ursamajor' && password === 'ursa618') {
      return c.json({ 
        success: true,
        admin: {
          id: 1,
          username: 'ursamajor',
          is_admin: true
        }
      })
    }

    return c.json({ error: 'Invalid admin credentials' }, 401)
  } catch (error) {
    return c.json({ error: 'Admin login failed' }, 500)
  }
})

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/users/:id', async (c) => {
  try {
    const userId = c.req.param('id')
    const user = await c.env.DB.prepare(
      'SELECT id, email, full_name, faculty, course, profile_image FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ user })
  } catch (error) {
    return c.json({ error: 'Failed to fetch user' }, 500)
  }
})

// Update profile image
app.post('/api/users/:id/profile-image', async (c) => {
  try {
    const userId = c.req.param('id')
    const { image_url } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE users SET profile_image = ? WHERE id = ?'
    ).bind(image_url, userId).run()

    return c.json({ success: true, image_url })
  } catch (error) {
    return c.json({ error: 'Failed to update profile image' }, 500)
  }
})

// ==================== FACULTY ROUTES ====================

// Get all faculties
app.get('/api/faculties', async (c) => {
  try {
    const faculties = await c.env.DB.prepare('SELECT * FROM faculties').all()
    return c.json({ faculties: faculties.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch faculties' }, 500)
  }
})

// Get faculty messages
app.get('/api/faculties/:id/messages', async (c) => {
  try {
    const facultyId = c.req.param('id')
    const currentUserId = c.req.query('userId')

    if (!currentUserId) {
      return c.json({ error: 'User ID required' }, 400)
    }

    // Cleanup old messages
    await cleanupOldMessages(c.env.DB)

    // Get messages from non-blocked users
    const messages = await c.env.DB.prepare(`
      SELECT m.*, u.full_name, u.profile_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.faculty_id = ?
      AND m.sender_id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = ?
      )
      ORDER BY m.created_at ASC
    `).bind(facultyId, currentUserId).all()

    return c.json({ messages: messages.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

// Send message to faculty chat
app.post('/api/faculties/:id/messages', async (c) => {
  try {
    const facultyId = c.req.param('id')
    const { sender_id, message } = await c.req.json()

    // Check if user is banned
    const user = await c.env.DB.prepare('SELECT is_banned FROM users WHERE id = ?').bind(sender_id).first()
    if (user && user.is_banned === 1) {
      return c.json({ error: 'You are banned' }, 403)
    }

    // Filter message
    const filteredMessage = await filterMessage(c.env.DB, message)

    // Set expiration to 72 hours from now
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    const result = await c.env.DB.prepare(
      `INSERT INTO messages (sender_id, faculty_id, message, expires_at) 
       VALUES (?, ?, ?, ?)`
    ).bind(sender_id, facultyId, filteredMessage, expiresAt).run()

    return c.json({ 
      success: true, 
      messageId: result.meta.last_row_id 
    })
  } catch (error) {
    return c.json({ error: 'Failed to send message' }, 500)
  }
})

// ==================== PRIVATE CHAT ROUTES ====================

// Get private chat messages
app.get('/api/private-chats', async (c) => {
  try {
    const user1 = c.req.query('user1')
    const user2 = c.req.query('user2')

    if (!user1 || !user2) {
      return c.json({ error: 'Both user IDs required' }, 400)
    }

    // Check if blocked
    const blocked = await isBlocked(c.env.DB, parseInt(user1), parseInt(user2))
    if (blocked) {
      return c.json({ error: 'You are blocked by this user' }, 403)
    }

    // Cleanup old messages
    await cleanupOldMessages(c.env.DB)

    // Get messages between two users
    const messages = await c.env.DB.prepare(`
      SELECT m.*, u.full_name, u.profile_image
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
      ORDER BY m.created_at ASC
    `).bind(user1, user2, user2, user1).all()

    return c.json({ messages: messages.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch private messages' }, 500)
  }
})

// Send private message
app.post('/api/private-chats', async (c) => {
  try {
    const { sender_id, receiver_id, message } = await c.req.json()

    // Check if user is banned
    const user = await c.env.DB.prepare('SELECT is_banned FROM users WHERE id = ?').bind(sender_id).first()
    if (user && user.is_banned === 1) {
      return c.json({ error: 'You are banned' }, 403)
    }

    // Check if blocked
    const blocked = await isBlocked(c.env.DB, sender_id, receiver_id)
    if (blocked) {
      return c.json({ error: 'You are blocked by this user' }, 403)
    }

    // Filter message
    const filteredMessage = await filterMessage(c.env.DB, message)

    // Set expiration to 72 hours from now
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    const result = await c.env.DB.prepare(
      `INSERT INTO messages (sender_id, receiver_id, message, expires_at) 
       VALUES (?, ?, ?, ?)`
    ).bind(sender_id, receiver_id, filteredMessage, expiresAt).run()

    return c.json({ 
      success: true, 
      messageId: result.meta.last_row_id 
    })
  } catch (error) {
    return c.json({ error: 'Failed to send private message' }, 500)
  }
})

// Get user's chat list
app.get('/api/users/:id/chats', async (c) => {
  try {
    const userId = c.req.param('id')

    const chats = await c.env.DB.prepare(`
      SELECT DISTINCT 
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id,
        u.full_name,
        u.profile_image,
        MAX(m.created_at) as last_message_time
      FROM messages m
      JOIN users u ON (
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END = u.id
      )
      WHERE (m.sender_id = ? OR m.receiver_id = ?)
      AND m.receiver_id IS NOT NULL
      GROUP BY other_user_id
      ORDER BY last_message_time DESC
    `).bind(userId, userId, userId, userId).all()

    return c.json({ chats: chats.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch chats' }, 500)
  }
})

// ==================== BLOCK & REPORT ROUTES ====================

// Block user
app.post('/api/blocks', async (c) => {
  try {
    const { blocker_id, blocked_id } = await c.req.json()

    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)'
    ).bind(blocker_id, blocked_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to block user' }, 500)
  }
})

// Report user
app.post('/api/reports', async (c) => {
  try {
    const { reporter_id, reported_id, reason } = await c.req.json()

    await c.env.DB.prepare(
      'INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)'
    ).bind(reporter_id, reported_id, reason).run()

    // Check if user has 16 or more reports
    const reportCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM reports WHERE reported_id = ?'
    ).bind(reported_id).first()

    return c.json({ 
      success: true,
      reportCount: reportCount?.count || 0,
      flagged: (reportCount?.count || 0) >= 16
    })
  } catch (error) {
    return c.json({ error: 'Failed to report user' }, 500)
  }
})

// ==================== ADMIN ROUTES ====================

// Get flagged users (16+ reports)
app.get('/api/admin/flagged-users', async (c) => {
  try {
    const flaggedUsers = await c.env.DB.prepare(`
      SELECT u.*, COUNT(r.id) as report_count
      FROM users u
      JOIN reports r ON u.id = r.reported_id
      GROUP BY u.id
      HAVING report_count >= 16
      ORDER BY report_count DESC
    `).all()

    return c.json({ users: flaggedUsers.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch flagged users' }, 500)
  }
})

// Get user's reports
app.get('/api/admin/users/:id/reports', async (c) => {
  try {
    const userId = c.req.param('id')

    const reports = await c.env.DB.prepare(`
      SELECT r.*, u.full_name as reporter_name
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.reported_id = ?
      ORDER BY r.created_at DESC
    `).bind(userId).all()

    return c.json({ reports: reports.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch reports' }, 500)
  }
})

// Ban user
app.post('/api/admin/users/:id/ban', async (c) => {
  try {
    const userId = c.req.param('id')

    await c.env.DB.prepare(
      'UPDATE users SET is_banned = 1 WHERE id = ?'
    ).bind(userId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to ban user' }, 500)
  }
})

// Unban user
app.post('/api/admin/users/:id/unban', async (c) => {
  try {
    const userId = c.req.param('id')

    await c.env.DB.prepare(
      'UPDATE users SET is_banned = 0 WHERE id = ?'
    ).bind(userId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to unban user' }, 500)
  }
})

// Get filter words
app.get('/api/admin/filter-words', async (c) => {
  try {
    const words = await c.env.DB.prepare('SELECT * FROM filter_words ORDER BY word').all()
    return c.json({ words: words.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch filter words' }, 500)
  }
})

// Add filter word
app.post('/api/admin/filter-words', async (c) => {
  try {
    const { word } = await c.req.json()

    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO filter_words (word) VALUES (?)'
    ).bind(word).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to add filter word' }, 500)
  }
})

// Delete filter word
app.delete('/api/admin/filter-words/:id', async (c) => {
  try {
    const wordId = c.req.param('id')

    await c.env.DB.prepare(
      'DELETE FROM filter_words WHERE id = ?'
    ).bind(wordId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete filter word' }, 500)
  }
})

// Get rules
app.get('/api/rules', async (c) => {
  try {
    const rules = await c.env.DB.prepare('SELECT * FROM rules ORDER BY id DESC LIMIT 1').first()
    return c.json({ rules: rules?.content || '' })
  } catch (error) {
    return c.json({ error: 'Failed to fetch rules' }, 500)
  }
})

// Update rules (admin only)
app.post('/api/admin/rules', async (c) => {
  try {
    const { content } = await c.req.json()

    await c.env.DB.prepare(
      'UPDATE rules SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
    ).bind(content).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update rules' }, 500)
  }
})

// Get daily topic
app.get('/api/daily-topic', async (c) => {
  try {
    const topic = await c.env.DB.prepare('SELECT * FROM daily_topics ORDER BY id DESC LIMIT 1').first()
    return c.json({ topic: topic?.content || '' })
  } catch (error) {
    return c.json({ error: 'Failed to fetch daily topic' }, 500)
  }
})

// Update daily topic (admin only)
app.post('/api/admin/daily-topic', async (c) => {
  try {
    const { content } = await c.req.json()

    await c.env.DB.prepare(
      'INSERT INTO daily_topics (content) VALUES (?)'
    ).bind(content).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to update daily topic' }, 500)
  }
})

// Get all users (admin only)
app.get('/api/admin/users', async (c) => {
  try {
    const users = await c.env.DB.prepare('SELECT id, email, phone, full_name, faculty, course, is_banned FROM users ORDER BY created_at DESC').all()
    return c.json({ users: users.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// ==================== FRONTEND ROUTE ====================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="az">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BSU Chat - Bakı Dövlət Universiteti Tələbə Chat Platforması</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .chat-container { max-height: calc(100vh - 250px); overflow-y: auto; scroll-behavior: smooth; }
            .message-bubble { max-width: 65%; word-wrap: break-word; }
            .message-received { background: #f3f4f6; border-radius: 20px 20px 20px 4px; }
            .message-sent { background: #3b82f6; color: white; border-radius: 20px 20px 4px 20px; }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
