require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const compression = require('compression');
const cron    = require('node-cron');
const path    = require('path');

const authRoutes            = require('./routes/authRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const applicationRoutes     = require('./routes/applicationRoutes');
const { deactivateInactiveUsers } = require('./controllers/authControllers');
const profileRoutes     = require('./routes/profileRoutes');
const intakeRoutes     = require('./routes/intakeRoutes');
const vacancyRoutes     = require('./routes/vacancyRoutes');
const internshipRoutes  = require('./routes/internshipRoutes');
const internshipApplicationRoutes = require('./routes/internshipApplicationRoutes');
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

// ── Security & Performance ─────────────────────────────────
app.use(helmet());
app.use(compression());

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
app.use('/api', vacancyRoutes);
app.use('/api', internshipRoutes);
app.use('/api', internshipApplicationRoutes);

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));