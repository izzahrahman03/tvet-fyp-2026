require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const path    = require('path');

const authRoutes            = require('./routes/authRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const applicationRoutes     = require('./routes/applicationRoutes');
const { deactivateInactiveUsers } = require('./controllers/authControllers');
const profileRoutes     = require('./routes/profileRoutes');
const intakeRoutes     = require('./routes/intakeRoutes');
const { profile } = require('console');

const app  = express();
const PORT = process.env.PORT;

// ── CORS ───────────────────────────────────────────────────
app.use(cors({
  origin:         process.env.FRONTEND_URL,
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
app.use('/api', adminRoutes);
app.use('/api', applicationRoutes);
app.use('/api', profileRoutes);
app.use('/api', intakeRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));