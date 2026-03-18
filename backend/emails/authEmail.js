// emails/authEmail.js
const transporter = require('../config/email');

// ─── Shared Base Template ─────────────────────────────────
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
                If you did not request this, please contact our support team immediately.
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


// ─── 1. Account Activation Email ─────────────────────────
// Sent when an admin creates a new user account.
exports.sendActivationEmail = (toEmail, toName, tempPassword, activationToken, role) => {
  const roleLabel    = ROLE_LABELS[role] || 'User';
  const activationUrl = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;

  const body = `
    <p style="margin:0 0 16px 0; font-size:15px; color:#1a1a1a;">
      Dear ${toName},
    </p>
    <p style="margin:0 0 20px 0; font-size:14px; color:#444444; line-height:1.7;">
      Your <strong>${roleLabel}</strong> account has been created on the Vitrox Academy portal.
      Please use the credentials below to activate your account.
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
  }).catch(err => console.error('[authEmail] sendActivationEmail error:', err.message));
};


// ─── 2. Forgot Password / Reset Password Email ────────────
// Sent when a user requests a password reset.
exports.sendPasswordResetEmail = (toEmail, toName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const body = `
    <p style="margin:0 0 16px 0; font-size:15px; color:#1a1a1a;">
      Dear ${toName},
    </p>
    <p style="margin:0 0 20px 0; font-size:14px; color:#444444; line-height:1.7;">
      We received a request to reset the password for your Vitrox Academy account.
      Click the button below to set a new password.
    </p>
    <p style="margin:0 0 20px 0; font-size:14px; color:#444444; line-height:1.7;">
      If you did not request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>

    ${ctaButton('Reset My Password', resetUrl)}
    ${fallbackUrl(resetUrl)}
    ${notice('This reset link will expire in <strong>1 hour</strong>.')}
  `;

  transporter.sendMail({
    from:    `"${process.env.FROM_NAME || 'Vitrox Academy'}" <${process.env.FROM_EMAIL}>`,
    to:      toEmail,
    subject: 'Password Reset Request — Vitrox Academy',
    html:    baseTemplate('Password Reset Request', body),
  }).catch(err => console.error('[authEmail] sendPasswordResetEmail error:', err.message));
};