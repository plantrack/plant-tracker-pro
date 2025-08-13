const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'plant-tracker-secret-key-2024';

// CRITICAL: Allow ALL origins for public access
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Add preflight handling for all routes
app.options('*', cors());

['uploads', 'uploads/thumbnails'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname.replace(/\s/g, '_'));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Initialize SQLite database with sqlite3
const db = new sqlite3.Database('./plants.db');

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      farm_name TEXT,
      spreadsheet_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      size_acres REAL,
      crop_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      field_id INTEGER,
      location_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      photo_path TEXT,
      notes TEXT,
      plant_type TEXT,
      growth_stage TEXT,
      height_cm REAL,
      health_score INTEGER,
      synced_to_sheets BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (field_id) REFERENCES fields(id)
    )
  `);

  // Create demo user (password: demo123)
  const hashedDemoPassword = '$2a$10$EkgIbzusalAjNsFdUGCMCOawbqq1xpSHy.C4CtTeL2AjVw47v04eO';
  db.run(
    `INSERT OR IGNORE INTO users (username, email, password, farm_name, spreadsheet_id) VALUES (?, ?, ?, ?, ?)`,
    ['demo', 'demo@planttracker.com', hashedDemoPassword, 'Demo Farm', 'not_configured']
  );
});

// Google Sheets setup (optional)
let sheetsAPI = null;
if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    sheetsAPI = google.sheets({ version: 'v4', auth });
  } catch (err) {
    console.log('Google Sheets integration not configured');
  }
}

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to run database queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Plant Tracker API Running',
    message: 'API is accessible from anywhere!',
    endpoints: {
      auth: '/api/auth/login, /api/auth/register',
      plants: '/api/plants (GET/POST)',
      fields: '/api/fields (GET/POST)',
      locations: '/api/plants/locations'
    },
    demo: {
      username: 'demo',
      password: 'demo123'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await getQuery(
      `SELECT * FROM users WHERE username = ? OR email = ?`,
      [username, username]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        farm_name: user.farm_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, farm_name } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await runQuery(
      `INSERT INTO users (username, email, password, farm_name, spreadsheet_id) VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, farm_name || '', 'not_configured']
    );
    
    const token = jwt.sign(
      { id: result.lastID, username, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: result.lastID,
        username,
        email,
        farm_name
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Plant endpoints
app.post('/api/plants', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { latitude, longitude, notes, plant_type, growth_stage, field_id, height_cm, health_score } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
    const location_id = `${parseFloat(latitude).toFixed(6)}_${parseFloat(longitude).toFixed(6)}`;
    
    const result = await runQuery(
      `INSERT INTO plants (user_id, field_id, location_id, latitude, longitude, photo_path, notes, plant_type, growth_stage, height_cm, health_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        field_id || null,
        location_id,
        latitude,
        longitude,
        photo_path,
        notes || '',
        plant_type || '',
        growth_stage || '',
        height_cm || null,
        health_score || null
      ]
    );
    
    // Sync to Google Sheets if configured
    if (sheetsAPI && req.user.spreadsheet_id && req.user.spreadsheet_id !== 'not_configured') {
      try {
        await sheetsAPI.spreadsheets.values.append({
          spreadsheetId: req.user.spreadsheet_id,
          range: 'Plants!A:K',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              result.lastID,
              location_id,
              latitude,
              longitude,
              new Date().toISOString(),
              photo_path || '',
              notes || '',
              plant_type || '',
              growth_stage || '',
              height_cm || '',
              health_score || ''
            ]]
          }
        });
        
        await runQuery(
          `UPDATE plants SET synced_to_sheets = 1 WHERE id = ?`,
          [result.lastID]
        );
      } catch (sheetsErr) {
        console.error('Google Sheets sync failed:', sheetsErr);
      }
    }
    
    res.json({
      id: result.lastID,
      location_id,
      message: 'Plant record created successfully'
    });
  } catch (err) {
    console.error('Plant creation error:', err);
    res.status(500).json({ error: 'Failed to create plant record' });
  }
});

app.get('/api/plants', authenticateToken, async (req, res) => {
  try {
    const plants = await allQuery(
      `SELECT * FROM plants WHERE user_id = ? ORDER BY timestamp DESC`,
      [req.user.id]
    );
    res.json(plants);
  } catch (err) {
    console.error('Plant fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

app.get('/api/plants/:id', authenticateToken, async (req, res) => {
  try {
    const plant = await getQuery(
      `SELECT * FROM plants WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (err) {
    console.error('Plant fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

// Field endpoints
app.get('/api/fields', authenticateToken, async (req, res) => {
  try {
    const fields = await allQuery(
      `SELECT * FROM fields WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(fields);
  } catch (err) {
    console.error('Field fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

app.post('/api/fields', authenticateToken, async (req, res) => {
  try {
    const { name, size_acres, crop_type } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Field name is required' });
    }
    
    const result = await runQuery(
      `INSERT INTO fields (user_id, name, size_acres, crop_type) VALUES (?, ?, ?, ?)`,
      [req.user.id, name, size_acres || 0, crop_type || '']
    );
    
    res.json({
      id: result.lastID,
      message: 'Field created successfully'
    });
  } catch (err) {
    console.error('Field creation error:', err);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

// Location aggregation endpoint
app.get('/api/plants/locations', authenticateToken, async (req, res) => {
  try {
    const locations = await allQuery(
      `SELECT 
        location_id,
        latitude,
        longitude,
        COUNT(*) as photo_count,
        MAX(timestamp) as last_visit
       FROM plants 
       WHERE user_id = ? 
       GROUP BY location_id 
       ORDER BY last_visit DESC`,
      [req.user.id]
    );
    res.json(locations);
  } catch (err) {
    console.error('Location fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Settings endpoints
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery(
      `SELECT id, username, email, farm_name, spreadsheet_id FROM users WHERE id = ?`,
      [req.user.id]
    );
    res.json(user);
  } catch (err) {
    console.error('Settings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { farm_name, spreadsheet_id } = req.body;
    
    await runQuery(
      `UPDATE users SET farm_name = ?, spreadsheet_id = ? WHERE id = ?`,
      [farm_name || '', spreadsheet_id || 'not_configured', req.user.id]
    );
    
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════╗
║     Plant Tracker API - PUBLIC ACCESS      ║
╠════════════════════════════════════════════╣
║  Status: ✓ Running                         ║
║  Port: ${PORT}                                ║
║  CORS: Enabled for ALL origins            ║
║                                            ║
║  Demo Account:                            ║
║  Username: demo                           ║
║  Password: demo123                        ║
║                                            ║
║  Access from ANYWHERE:                    ║
║  - Expo Go                                ║
║  - Web browsers                           ║
║  - Mobile apps                            ║
║  - Any network (5G/LTE/WiFi)             ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database connection...');
  db.close();
  process.exit(0);
});