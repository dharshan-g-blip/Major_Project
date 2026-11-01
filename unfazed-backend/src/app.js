const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const therapistRoutes = require('./routes/therapistRoutes');
const clientRoutes = require('./routes/clientRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const noteRoutes = require('./routes/noteRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationService = require('./services/notificationService');
const backupService = require('./services/backupService');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory for invoices & uploaded assets
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Unfazed Practice Management SaaS',
    architecture: 'Single-Port Unified Service',
    timestamp: new Date().toISOString(),
  });
});

// Notifications audit log endpoint (for real-time observation in UI)
app.get('/api/notifications/logs', (req, res) => {
  res.json({
    success: true,
    logs: notificationService.getRecentLogs(),
  });
});

// Automated Fallback & Safety Backup Endpoints
app.get('/api/backup/status', (req, res) => {
  res.json({
    success: true,
    backup: backupService.getBackupStatus(),
  });
});

app.post('/api/backup/trigger', async (req, res) => {
  const snapshot = await backupService.exportSnapshot();
  res.json({
    success: true,
    message: 'Safety snapshot created successfully',
    counts: snapshot?.counts,
  });
});

// Resilient Fallback Middleware: Serves snapshot data if MongoDB is temporarily offline/unreachable
const mockDbFallback = require('./middleware/mockDbFallback');
app.use('/api', mockDbFallback);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/analytics', analyticsRoutes);

// Single-Port Architecture: Serve Frontend Production Build
let frontendDistPath = path.join(__dirname, '../../unfazed-frontend/dist');
if (!fs.existsSync(frontendDistPath)) {
  const localPublic = path.join(__dirname, '../public');
  const localDist = path.join(__dirname, '../dist');
  if (fs.existsSync(localPublic)) frontendDistPath = localPublic;
  else if (fs.existsSync(localDist)) frontendDistPath = localDist;
}
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // Client-side routing fallback for React SPA
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Helpful developer guidance if frontend has not been compiled yet
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>Unfazed API & Single-Port Server Running</h2>
        <p>Frontend dist directory not found yet. Run <code>npm run build:frontend</code> to serve the unified React UI on this port.</p>
        <p>API Health: <a href="/api/health">/api/health</a></p>
      </div>
    `);
  });
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;
