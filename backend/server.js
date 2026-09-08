require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const { sequelize } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');
const { startBirthdayWisherJob } = require('./jobs/birthdayWisher.job');
const { startFestivalWisherJob } = require('./jobs/festivalWisher.job');
const { startLeaveResetJob } = require('./jobs/leaveReset.job');
const { startAbsentMarkerJob, catchUpAbsentMarker } = require('./jobs/absentMarker.job');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: false,                        // Don't force HTTPS — we run on HTTP for LAN
  contentSecurityPolicy: false,       // Don't add upgrade-insecure-requests
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // Same-origin in production (backend serves frontend)
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        process.env.FRONTEND_URL,
      ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Static file serving (auth-aware via API route) ──────────────────────────
const authMiddleware = require('./middleware/auth');
app.use('/api/files', authMiddleware, (req, res) => {
  const filePath = req.path.replace(/^\//, '');
  const absolutePath = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads', filePath);
  res.sendFile(absolutePath, (err) => {
    if (err) res.status(404).json({ success: false, message: 'File not found.', errors: [] });
  });
});

// Direct uploads path for convenience in dev
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Saven HR Portal API is running.', data: { uptime: process.uptime() } });
});

// ─── Production: Serve React frontend build ──────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendBuild));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  // ─── 404 handler (dev only — production uses SPA fallback above) ───────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}`, errors: [] });
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // Verify DB connection before starting
    await sequelize.authenticate();
    console.log('[DB] MySQL connection established.');

    // Sync models (use migrations in production; sync:false in production)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      console.log('[DB] Models synced.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Saven HR Portal API running on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start cron jobs
    startBirthdayWisherJob();
    startFestivalWisherJob();
    startLeaveResetJob();
    startAbsentMarkerJob();
    console.log('[Cron] All cron jobs started.');

    // Catch up any missed absent markings from past days
    catchUpAbsentMarker();
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
