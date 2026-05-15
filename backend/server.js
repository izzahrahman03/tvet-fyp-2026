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
const evaluationRoutes   = require('./routes/evaluationRoutes');
const terminationRoutes   = require('./routes/terminationRoutes');
const interviewerApplicationsRoutes = require('./routes/interviewerApplicationsRoutes');
const timeRoutes = require('./routes/timeRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');

const { profile } = require('console');

const app  = express();
const PORT = process.env.PORT;

// ── CORS ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,          // add this to your .env
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
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
app.use('/api', evaluationRoutes);
app.use('/api', terminationRoutes);
app.use('/api', interviewerApplicationsRoutes);
app.use('/api', timeRoutes);
app.use('/api', adminDashboardRoutes);


app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));