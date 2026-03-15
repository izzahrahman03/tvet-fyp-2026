require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const path    = require('path');

const authRoutes            = require('./routes/authRoutes');
const applicationRoutes     = require('./routes/applicationRoutes');
const { deactivateInactiveUsers } = require('./controllers/authControllers');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── CORS ───────────────────────────────────────────────────
app.use(cors({
  origin:         process.env.FRONTEND_URL || 'http://localhost:3000',
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
}));

// ── Middleware ─────────────────────────────────────────────
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Cron ───────────────────────────────────────────────────
cron.schedule('0 0 * * *', () => {
  console.log('Checking inactive users');
  deactivateInactiveUsers();
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', applicationRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));