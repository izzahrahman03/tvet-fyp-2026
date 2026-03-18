// emails/adminEmail.js
const transporter = require('../config/email');

// ─── Shared Base Template ─────────────────────────────────
// (Identical wrapper to authEmail so all system emails look the same)
const baseTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff; border:1px solid #dddddd; border-radius:4px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a3c5e; padding:28px 40px;">
              <p style="margin:0; font-size:20px; font-weight:bold; color:#ffffff; letter-spacing:0.5px;">
                Vitrox Academy
              </p>
            </td>
          </tr>

          <!-- Title Bar -->
          <tr>
            <td style="padding:24px 40px 0 40px; border-bottom:2px solid #1a3c5e;">
              <p style="margin:0 0 12px 0; font-size:18px; font-weight:bold; color:#1a3c5e;">
                ${title}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px; border-top:1px solid #dddddd; background-color:#f9f9f9;">
              <p style="margin:0; font-size:12px; color:#888888; line-height:1.6;">
                This is an automated message from Vitrox Academy. Please do not reply to this email.<br />
                If you did not expect this message, please contact our support team immediately.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Reusable HTML Snippets ───────────────────────────────

const infoRow = (label, value) => `
  <tr>
    <td style="padding:6px 0; font-size:14px; color:#555555; width:160px; vertical-align:top;">
      ${label}
    </td>
    <td style="padding:6px 0; font-size:14px; color:#1a1a1a; font-weight:bold; vertical-align:top;">
      ${value}
    </td>
  </tr>
`;

const ctaButton = (label, url) => `
  <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr>
      <td style="background-color:#1a3c5e; border-radius:3px;">
        <a href="${url}"
           style="display:inline-block; padding:12px 28px; font-size:14px;
                  color:#ffffff; text-decoration:none; font-weight:bold; letter-spacing:0.3px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

const fallbackUrl = (url) => `
  <p style="margin:16px 0 0 0; font-size:12px; color:#888888;">
    If the button does not work, copy and paste the link below into your browser:<br />
    <a href="${url}" style="color:#1a3c5e; word-break:break-all;">${url}</a>
  </p>
`;

const notice = (text) => `
  <p style="margin:20px 0 0 0; font-size:12px; color:#888888;">${text}</p>
`;

// ─── Role Label Map ───────────────────────────────────────
const ROLE_LABELS = {
  applicant:           'Applicant',
  student:             'Student',
  industry_partner:    'Industry Partner',
  industry_supervisor: 'Industry Supervisor',
  admin:               'Admin',
};

// ─── Status Config ────────────────────────────────────────
// Maps each application status to a subject line, badge colour, and message body.
const STATUS_CONFIG = {
  under_review: {
    subject: 'Your Application Is Under Review',
    badge:   { bg: '#e8f0fe', text: '#1a3c5e', label: 'Under Review' },
    message: `Your application has been received and is currently under review by our admissions team.
              We will notify you of any updates. No further action is required at this time.`,
  },
  interview: {
    subject: 'Interview Invitation — Vitrox Academy',
    badge:   { bg: '#fff8e1', text: '#b45309', label: 'Interview Scheduled' },
    message: `Congratulations! We are pleased to invite you for an interview as part of the
              admissions process. Please review the interview details below and attend at the
              scheduled time.`,
  },
  approved: {
    subject: 'Application Approved — Offer of Admission',
    badge:   { bg: '#e8f5e9', text: '#1b5e20', label: 'Approved' },
    message: `We are delighted to inform you that your application has been approved.
              Please log in to the portal to accept or decline this offer. Note that the offer
              is subject to a response deadline — please act promptly.`,
  },
  rejected_review: {
    subject: 'Application Outcome — Vitrox Academy',
    badge:   { bg: '#fce4e4', text: '#b91c1c', label: 'Unsuccessful' },
    message: `After careful consideration, we regret to inform you that your application
              has been unsuccessful at the review stage. We appreciate your interest in
              Vitrox Academy and encourage you to apply again in a future intake.`,
  },
  rejected_interview: {
    subject: 'Application Outcome — Vitrox Academy',
    badge:   { bg: '#fce4e4', text: '#b91c1c', label: 'Unsuccessful' },
    message: `Thank you for attending the interview. After careful deliberation, we regret
              to inform you that we are unable to offer you a place in this intake.
              We appreciate the time you invested and wish you well in your future endeavours.`,
  },
  accepted: {
    subject: 'Enrolment Confirmed — Welcome to Vitrox Academy',
    badge:   { bg: '#e8f5e9', text: '#1b5e20', label: 'Enrolled' },
    message: `Your enrolment has been confirmed. Welcome to Vitrox Academy! Further details
              regarding your programme, orientation, and student portal access will be
              sent to you shortly.`,
  },
  withdraw: {
    subject: 'Application Withdrawal Confirmed',
    badge:   { bg: '#f3f4f6', text: '#374151', label: 'Withdrawn' },
    message: `We have received and processed your withdrawal request. Your application
              has been closed. If this was done in error, please contact our admissions
              team as soon as possible.`,
  },
};


// ─── 1. Bulk Import Activation Email ─────────────────────
// Sent to each user created via the admin bulk-import (Excel upload).
exports.sendBulkActivationEmail = (toEmail, toName, tempPassword, activationToken, role) => {
  const roleLabel     = ROLE_LABELS[role] || 'User';
  const activationUrl = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;

  const body = `
    <p style="margin:0 0 16px 0; font-size:15px; color:#1a1a1a;">
      Dear ${toName},
    </p>
    <p style="margin:0 0 20px 0; font-size:14px; color:#444444; line-height:1.7;">
      A <strong>${roleLabel}</strong> account has been created for you on the Vitrox Academy portal.
      Please use the credentials below to activate your account and set a permanent password.
    </p>

    <table cellpadding="0" cellspacing="0"
           style="background-color:#f4f7fb; border:1px solid #d8e4f0;
                  border-radius:3px; padding:16px 20px; margin-bottom:8px;">
      ${infoRow('Email Address', toEmail)}
      ${infoRow('Temporary Password', `<span style="font-family:monospace;">${tempPassword}</span>`)}
    </table>

    ${ctaButton('Activate My Account', activationUrl)}
    ${fallbackUrl(activationUrl)}
    ${notice('This activation link will expire in <strong>24 hours</strong>. Please activate your account before it expires.')}
  `;

  transporter.sendMail({
    from:    `"${process.env.FROM_NAME || 'Vitrox Academy'}" <${process.env.FROM_EMAIL}>`,
    to:      toEmail,
    subject: 'Activate Your Vitrox Academy Account',
    html:    baseTemplate('Account Activation', body),
  }).catch(err => console.error('[adminEmail] sendBulkActivationEmail error:', err.message));
};


// ─── 2. Application Status Email ─────────────────────────
// Sent when an admin updates an applicant's application status.
// interviewDetails = { datetime, venue, interviewer_name, remarks } | null
exports.sendApplicationStatusEmail = (toEmail, applicantName, status, interviewDetails = null) => {
  const config = STATUS_CONFIG[status];
  if (!config) {
    console.warn(`[adminEmail] No email config for status: "${status}". Email not sent.`);
    return;
  }

  const { subject, badge, message } = config;

  // ── Status Badge ──
  const badgeHtml = `
    <span style="
      display:inline-block;
      padding:4px 14px;
      background-color:${badge.bg};
      color:${badge.text};
      font-size:13px;
      font-weight:bold;
      border-radius:3px;
      border:1px solid ${badge.text}30;
      margin-bottom:20px;
    ">${badge.label}</span>
  `;

  // ── Interview Details Block (only for 'interview' status) ──
  let interviewBlock = '';
  if (status === 'interview' && interviewDetails) {
    const { datetime, venue, interviewer_name, remarks } = interviewDetails;
    interviewBlock = `
      <table cellpadding="0" cellspacing="0"
             style="background-color:#f4f7fb; border:1px solid #d8e4f0;
                    border-radius:3px; padding:16px 20px; margin:20px 0 0 0; width:100%;">
        <tr>
          <td colspan="2" style="padding-bottom:10px; font-size:13px;
                                  font-weight:bold; color:#1a3c5e; text-transform:uppercase;
                                  letter-spacing:0.5px; border-bottom:1px solid #d8e4f0;">
            Interview Details
          </td>
        </tr>
        ${datetime        ? infoRow('Date &amp; Time', new Date(datetime).toLocaleString('en-MY', { dateStyle: 'long', timeStyle: 'short' })) : ''}
        ${venue           ? infoRow('Venue',           venue)           : ''}
        ${interviewer_name ? infoRow('Interviewer',    interviewer_name) : ''}
        ${remarks         ? infoRow('Remarks',         remarks)         : ''}
      </table>
    `;
  }

  const body = `
    <p style="margin:0 0 16px 0; font-size:15px; color:#1a1a1a;">
      Dear ${applicantName},
    </p>

    ${badgeHtml}

    <p style="margin:0; font-size:14px; color:#444444; line-height:1.8;">
      ${message}
    </p>

    ${interviewBlock}
  `;

  transporter.sendMail({
    from:    `"${process.env.FROM_NAME || 'Vitrox Academy'}" <${process.env.FROM_EMAIL}>`,
    to:      toEmail,
    subject: `${subject}`,
    html:    baseTemplate(subject, body),
  }).catch(err => console.error(`[adminEmail] sendApplicationStatusEmail error (${status}):`, err.message));
};