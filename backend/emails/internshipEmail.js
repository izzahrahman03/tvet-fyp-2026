// emails/internshipEmail.js
// Internship application status emails.

const transporter = require('../config/email');

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
        <table width="600" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff; border:1px solid #dddddd; border-radius:4px;">
          <tr>
            <td style="background-color:#1a3c5e; padding:28px 40px;">
              <p style="margin:0; font-size:20px; font-weight:bold; color:#ffffff; letter-spacing:0.5px;">
                Vitrox Academy
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0 40px; border-bottom:2px solid #1a3c5e;">
              <p style="margin:0 0 12px 0; font-size:18px; font-weight:bold; color:#1a3c5e;">
                ${title}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px; border-top:1px solid #dddddd; background-color:#f9f9f9;">
              <p style="margin:0; font-size:12px; color:#888888; line-height:1.6;">
                This is an automated message from Vitrox Academy. Please do not reply to this email.<br />
                If you did not expect this message, please contact our support team immediately.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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

// Status Config — covers all statuses that trigger an email
const STATUS_CONFIG = {

  // Partner sets these
  interview: {
    subject: 'Interview Invitation - Internship Application',
    badge:   { bg: '#ede9fe', text: '#6d28d9', label: 'Interview Scheduled' },
    message: 'Congratulations! We are pleased to inform you that your internship application has been shortlisted. You have been invited for an interview. Please review the details below and ensure you attend on time.',
  },
  passed: {
    subject: 'Internship Interview Result - You Passed!',
    badge:   { bg: '#dcfce7', text: '#15803d', label: 'Passed' },
    message: 'Congratulations! We are pleased to inform you that you have passed the internship interview. Please log in to the portal to accept or decline this internship offer. Kindly respond promptly as the offer is time-sensitive.',
  },
  failed: {
    subject: 'Internship Interview Result - Vitrox Academy',
    badge:   { bg: '#fee2e2', text: '#b91c1c', label: 'Unsuccessful' },
    message: 'Thank you for attending the internship interview. After careful evaluation, we regret to inform you that we are unable to offer you a placement at this time. We appreciate the effort you invested and encourage you to apply for other opportunities in the future.',
  },

  // Student sets these
  accepted: {
    subject: 'Internship Offer Confirmed - Congratulations!',
    badge:   { bg: '#dcfce7', text: '#15803d', label: 'Accepted' },
    message: 'You have successfully accepted the internship offer. Congratulations and welcome aboard! Further details regarding your placement, start date, and onboarding will be shared with you shortly by the company.',
  },
  declined: {
    subject: 'Internship Offer Declined - Vitrox Academy',
    badge:   { bg: '#f3f4f6', text: '#374151', label: 'Declined' },
    message: 'We have recorded your decision to decline this internship offer. Your application has been updated accordingly. If this was done in error, please contact the support team as soon as possible.',
  },

  // Withdrawal flow
  withdrawn: {
    subject: 'Internship Withdrawal Approved - Vitrox Academy',
    badge:   { bg: '#f1f5f9', text: '#475569', label: 'Withdrawn' },
    message: 'Your withdrawal request has been approved by the company. Your internship application has been officially withdrawn. If you have any questions, please contact our support team.',
  },
};

/**
 * sendInternshipStatusEmail
 *
 * @param {string} toEmail
 * @param {string} studentName
 * @param {string} positionName
 * @param {string} companyName
 * @param {string} status   - "interview"|"passed"|"failed"|"accepted"|"declined"|"withdrawn"
 * @param {object} details  - { interview_datetime, interview_location } for interview only
 */
exports.sendInternshipStatusEmail = (
  toEmail,
  studentName,
  positionName,
  companyName,
  status,
  details = null
) => {
  const config = STATUS_CONFIG[status];
  if (!config) {
    console.warn(`[internshipEmail] No config for status: "${status}". Email not sent.`);
    return;
  }

  const { subject, badge, message } = config;

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

  // Position details block — shown for all statuses
  const positionBlock = `
    <table cellpadding="0" cellspacing="0"
           style="background-color:#f4f7fb; border:1px solid #d8e4f0;
                  border-radius:3px; padding:16px 20px; margin:20px 0 0 0; width:100%;">
      <tr>
        <td colspan="2" style="padding-bottom:10px; font-size:13px;
                                font-weight:bold; color:#1a3c5e; text-transform:uppercase;
                                letter-spacing:0.5px; border-bottom:1px solid #d8e4f0;">
          Position Details
        </td>
      </tr>
      ${infoRow('Position', positionName)}
      ${infoRow('Company',  companyName)}
    </table>
  `;

  // Interview details block — only for "interview" status
  let interviewBlock = '';
  if (status === 'interview' && details && details.interview_datetime) {
    const dtFormatted = new Date(details.interview_datetime)
      .toLocaleString('en-MY', { dateStyle: 'full', timeStyle: 'short' });

    interviewBlock = `
      <table cellpadding="0" cellspacing="0"
             style="background-color:#f5f3ff; border:1px solid #ddd6fe;
                    border-radius:3px; padding:16px 20px; margin:16px 0 0 0; width:100%;">
        <tr>
          <td colspan="2" style="padding-bottom:10px; font-size:13px;
                                  font-weight:bold; color:#6d28d9; text-transform:uppercase;
                                  letter-spacing:0.5px; border-bottom:1px solid #ddd6fe;">
            Interview Details
          </td>
        </tr>
        ${infoRow('Date &amp; Time', dtFormatted)}
        ${details.interview_location ? infoRow('Location / Venue', details.interview_location) : ''}
      </table>
      <p style="margin:14px 0 0 0; font-size:13px; color:#888888;">
        Please ensure you arrive on time. If you are unable to attend, contact the company directly.
      </p>
    `;
  }

  const body = `
    <p style="margin:0 0 16px 0; font-size:15px; color:#1a1a1a;">
      Dear ${studentName},
    </p>

    ${badgeHtml}

    <p style="margin:0; font-size:14px; color:#444444; line-height:1.8;">
      ${message}
    </p>

    ${positionBlock}
    ${interviewBlock}
  `;

  transporter.sendMail({
    from:    `"${process.env.FROM_NAME || 'Vitrox Academy'}" <${process.env.FROM_EMAIL}>`,
    to:      toEmail,
    subject: subject,
    html:    baseTemplate(subject, body),
  }).catch(err => console.error(`[internshipEmail] error (${status}):`, err.message));
};