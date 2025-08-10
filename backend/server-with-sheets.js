const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GoogleSheetsService = require('./google-sheets');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'plant-tracker-secret-key-2024';

// Initialize Google Sheets
const googleSheets = new GoogleSheetsService();
googleSheets.initialize();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

const db = new Database('./plants.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    farm_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
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

db.exec(`
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (field_id) REFERENCES fields(id)
  )
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_location ON plants(location_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_user_plants ON plants(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_coords ON plants(latitude, longitude)`);

// Create demo user
const insertDemo = db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password, farm_name) 
  VALUES (?, ?, ?, ?)
`);

try {
  insertDemo.run('demo', 'demo@planttracker.com', '$2a$10$EkgIbzusalAjNsFdUGCMCOawbqq1xpSHy.C4CtTeL2AjVw47v04eO', 'Demo Farm');
  console.log('Demo user created - username: demo, password: demo123');
} catch (err) {
  // User already exists
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.json({ 
    status: 'Plant Tracker API Running',
    features: {
      database: 'SQLite (local)',
      googleSheets: googleSheets.sheets ? 'Connected' : 'Not configured',
    },
    endpoints: {
      'POST /api/auth/register': 'Create new account',
      'POST /api/auth/login': 'Login to account',
      'GET /api/fields': 'Get user fields',
      'POST /api/fields': 'Create new field',
      'GET /api/plants': 'Get plants (with optional location filter)',
      'POST /api/plants': 'Create new plant record (saves to Google Sheets)',
      'GET /api/plants/location/:id': 'Get plants at specific location',
      'GET /api/plants/locations': 'Get all unique locations',
      'GET /api/sheets/records': 'Get all records from Google Sheets'
    },
    demo_credentials: {
      username: 'demo',
      password: 'demo123'
    }
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, farm_name } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password required' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const insert = db.prepare(
      `INSERT INTO users (username, email, password, farm_name) VALUES (?, ?, ?, ?)`
    );
    
    try {
      const result = insert.run(username, email, hashedPassword, farm_name || '');
      
      const token = jwt.sign(
        { id: result.lastInsertRowid, username, email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.json({ 
        token,
        user: { id: result.lastInsertRowid, username, email, farm_name }
      });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  try {
    const stmt = db.prepare(
      `SELECT * FROM users WHERE username = ? OR email = ?`
    );
    const user = stmt.get(username, username);
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fields', authenticateToken, (req, res) => {
  const { name, size_acres, crop_type } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Field name required' });
  }
  
  try {
    const insert = db.prepare(
      `INSERT INTO fields (user_id, name, size_acres, crop_type) VALUES (?, ?, ?, ?)`
    );
    const result = insert.run(req.user.id, name, size_acres || 0, crop_type || '');
    res.json({ id: result.lastInsertRowid, message: 'Field created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fields', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(
      `SELECT * FROM fields WHERE user_id = ? ORDER BY created_at DESC`
    );
    const rows = stmt.all(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plants', authenticateToken, upload.single('photo'), async (req, res) => {
  const { 
    latitude, longitude, notes, plant_type, growth_stage, 
    field_id, height_cm, health_score 
  } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Location (latitude, longitude) required' });
  }
  
  const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
  const location_id = `${parseFloat(latitude).toFixed(6)}_${parseFloat(longitude).toFixed(6)}`;
  
  try {
    // Save to SQLite database
    const insert = db.prepare(
      `INSERT INTO plants (
        user_id, field_id, location_id, latitude, longitude, photo_path,
        notes, plant_type, growth_stage, height_cm, health_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    const result = insert.run(
      req.user.id, field_id || null, location_id, latitude, longitude, photo_path,
      notes || '', plant_type || '', growth_stage || '', height_cm || null, health_score || null
    );
    
    // Get user info for Google Sheets
    const userStmt = db.prepare(`SELECT username, farm_name FROM users WHERE id = ?`);
    const user = userStmt.get(req.user.id);
    
    // Get field name if field_id exists
    let fieldName = '';
    if (field_id) {
      const fieldStmt = db.prepare(`SELECT name FROM fields WHERE id = ?`);
      const field = fieldStmt.get(field_id);
      fieldName = field ? field.name : '';
    }
    
    // Save to Google Sheets (async, don't wait)
    googleSheets.addPlantRecord({
      userId: req.user.id,
      username: user.username,
      farmName: user.farm_name,
      fieldName: fieldName,
      locationId: location_id,
      latitude: latitude,
      longitude: longitude,
      plantType: plant_type || '',
      growthStage: growth_stage || '',
      heightCm: height_cm || '',
      healthScore: health_score || '',
      notes: notes || ''
    }).catch(err => {
      console.error('Google Sheets save error:', err.message);
    });
    
    res.json({ 
      id: result.lastInsertRowid,
      location_id,
      message: 'Plant record created successfully',
      googleSheets: 'Data will be synced to Google Sheets'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plants', authenticateToken, (req, res) => {
  const { latitude, longitude, radius = 10, field_id } = req.query;
  
  let query = `SELECT * FROM plants WHERE user_id = ?`;
  let params = [req.user.id];
  
  if (field_id) {
    query += ` AND field_id = ?`;
    params.push(field_id);
  }
  
  if (latitude && longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius) / 111000;
    query += ` AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?`;
    params.push(lat - rad, lat + rad, lon - rad, lon + rad);
  }
  
  query += ` ORDER BY timestamp DESC`;
  
  try {
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plants/location/:location_id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(
      `SELECT * FROM plants WHERE user_id = ? AND location_id = ? ORDER BY timestamp DESC`
    );
    const rows = stmt.all(req.user.id, req.params.location_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plants/locations', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(
      `SELECT DISTINCT location_id, latitude, longitude, 
       COUNT(*) as photo_count,
       MAX(timestamp) as last_visit
       FROM plants 
       WHERE user_id = ?
       GROUP BY location_id
       ORDER BY last_visit DESC`
    );
    const rows = stmt.all(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New endpoint to get all records from Google Sheets
app.get('/api/sheets/records', authenticateToken, async (req, res) => {
  try {
    const records = await googleSheets.getAllRecords();
    res.json({
      total: records.length,
      records: records
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Google Sheets records' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Plant Tracker Server running on http://localhost:${PORT}`);
  console.log(`Demo credentials - username: demo, password: demo123`);
  console.log('Google Sheets integration:', googleSheets.sheets ? 'Ready' : 'Not configured');
});