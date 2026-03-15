// config/email.js
// Nodemailer transporter — works with Gmail and Outlook SMTP
// npm install nodemailer

const nodemailer = require("nodemailer");

// ─── Transporter ──────────────────────────────────────────
// For Gmail:  SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_SECURE=true
// For Outlook: SMTP_HOST=smtp.office365.com  SMTP_PORT=587  SMTP_SECURE=false
//
// Gmail users: use an App Password, NOT your account password.
// Generate one at: https://myaccount.google.com/apppasswords
// (Requires 2FA to be enabled on your Google account)

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Verify connection on startup ─────────────────────────
transporter.verify((err) => {
  if (err) console.error("❌ Email transporter error:", err.message);
  else     console.log("✅ Email transporter ready");
});

module.exports = transporter;