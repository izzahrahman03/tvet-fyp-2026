import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../css/dashboard/applicantDashboard.css";
import "../../css/applicationManagement/applicationForm.css";
import "../../css/applicationManagement/myApplication.css";
import Layout from '../../components/dashboard/Layout';

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem('token');

function Icon({ d, size = 14, color = 'currentColor', sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── Status map — clean flow + backward-compat old values ──
const STATUS_MAP = {
draft:     { label: 'Draft',     bg: '#e2e8f0', color: '#1e293b' },
submitted: { label: 'Submitted', bg: '#bfdbfe', color: '#1e3a8a' },
attended:  { label: 'Attended',  bg: '#bae6fd', color: '#0c4a6e' },
absent:    { label: 'Absent',    bg: '#fed7aa', color: '#7c2d12' },
passed:    { label: 'Passed',    bg: '#bbf7d0', color: '#14532d' },
failed:    { label: 'Failed',    bg: '#fecaca', color: '#7f1d1d' },
accepted:  { label: 'Accepted',  bg: '#86efac', color: '#14532d' },
declined:  { label: 'Declined',  bg: '#fca5a5', color: '#7f1d1d',},
};

// ── "How did you hear about us" label map ─────────────────
const HEAR_ABOUT_MAP = {
  social_tiktok:    'Social Media – TikTok',
  social_instagram: 'Social Media – Instagram',
  social_facebook:  'Social Media – Facebook',
  friends_family:   'Friends / Family Recommendation',
  school_teacher:   'School Teacher / Counsellor Recommendation',
  vitrox_website:   "ViTrox TVET's Website",
  events:           'Events (Education / Career Fair, School Visit)',
};

function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const s   = STATUS_MAP[key] || STATUS_MAP.submitted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',gap: '0',
      background: s.bg, color: s.color,
      fontSize: '18px', fontWeight: '700', padding: '13px 18px',
      borderRadius: '2px', letterSpacing: '0.3px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function ReadField({ label, value, fullWidth = false }) {
  return (
    <div className={`af-field${fullWidth ? ' af-col-full' : ''}`}>
      <label className="af-label">{label}</label>
      <p className="ma-read-value">{value || <span className="ma-empty-val">—</span>}</p>
    </div>
  );
}

function FormSeparator({ title }) {
  return (
    <div className="af-form-separator af-col-full">
      <span className="af-form-separator-label">{title}</span>
      <div className="af-form-separator-line" />
    </div>
  );
}

// ── Status-aware notice banners ───────────────────────────
function StatusNotice({ status }) {
  const key = (status || '').toLowerCase();

  const notices = {
     draft: {
      type: 'info',
      icon: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
      msg:  'Your application is saved as a draft. Complete and submit it when you are ready.',
    },
    submitted: {
      type: 'info',
      icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3',
      msg:  'Your application has been received and your interview slot is reserved. Please attend on the scheduled date.',
    },
    attended: {
      type: 'info',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
      msg:  'Thank you for attending your interview. Our team is evaluating your performance — results will be announced soon.',
    },
    absent: {
      type: 'warning',
      icon: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      msg:  'You were recorded as absent for your interview. Please contact us immediately if you believe this is an error.',
    },
    passed: {
      type: 'success',
      icon: 'M20 6L9 17l-5-5',
      msg:  'Congratulations! You have passed the interview evaluation. Please accept or decline the offer below.',
    },
    failed: {
      type: 'error',
      icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
      msg:  'Thank you for attending the interview. Unfortunately you did not pass the evaluation at this time.',
    },
    accepted: {
      type: 'success',
      icon: 'M20 6L9 17l-5-5',
      msg:  'You have accepted the offer and will be enrolled as a student. Welcome aboard! Our team will be in touch shortly.',
    },
    rejected: {
      type: 'error',
      icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
      msg:  'Your application was unsuccessful at this time. Please contact us if you have any questions.',
    },
    declined: {
      type: 'warning',
      icon: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      msg:  'Your application has been declined. Contact us if you believe this was done in error.',
    },
  };

  const notice = notices[key];
  if (!notice) return null;

  const typeStyles = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
  };
  const t = typeStyles[notice.type];

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      background: t.bg, border: `1px solid ${t.border}`, color: t.color,
      borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
      fontSize: '17px', fontWeight: '500',
    }}>
      <Icon d={notice.icon} size={15} color={t.color} />
      {notice.msg}
    </div>
  );
}

// ── Interview details card ─────────────────────────────────
function InterviewDetails({ application }) {
  const showStatuses = ['attended', 'no_show', 'passed', 'failed', 'accepted', 'rejected', 'withdrawn',];
  if (!showStatuses.includes(application.status?.toLowerCase())) return null;
  if (!application.interviewDatetime) return null;

  const fmt = (d) => d
    ? new Date(d).toLocaleString('en-MY', { dateStyle: 'full', timeStyle: 'short' })
    : '—';

  return (
    <div className="af-card ma-section-card">
      <div className="af-card-header ma-section-card-header">
        <div className="ma-section-heading">
          <div className="ma-section-icon">
            <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 2 2z" size={15} color="#7c3aed" />
          </div>
          <div>
            <p className="af-card-title">Interview Details</p>
            <p className="af-card-subtitle">Your scheduled interview information</p>
          </div>
        </div>
      </div>
      <div className="af-card-body">
        <div className="af-form-grid">
          <ReadField label="Date & Time" value={fmt(application.interviewDatetime)} fullWidth />
          <ReadField label="Venue"       value={application.venue}            fullWidth />
          <ReadField label="Interviewer" value={application.interviewerName} />
          {application.remarks && <ReadField label="Remarks" value={application.remarks} />}
        </div>
      </div>
    </div>
  );
}

// ── Selected slot card ─────────────────────────────────────
function SelectedSlotCard({ datetime, capacity }) {
  if (!datetime) return null;
  const fmt = (d) => new Date(d).toLocaleString('en-MY', { dateStyle: 'full', timeStyle: 'short' });
  return (
    <div style={{
      background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px',
      padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '10px',
    }}>
      <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 2 2z" size={14} color="#1d4ed8" />
      <div>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e40af' }}>
          Preferred Interview Slot
        </p>
        <p style={{ margin: '3px 0 0', fontSize: '15px', color: '#1e3a8a' }}>{fmt(datetime)}</p>
        {capacity && (
          <p style={{ margin: '2px 0 0', fontSize: '15px', color: '#1d4ed8' }}>
            Capacity: {capacity} applicants
          </p>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function MyApplication() {
  const navigate = useNavigate();

  const [application,  setApplication]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res  = await fetch(`${API}/my-application`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();

        if (!res.ok) { setError(data.message || 'Failed to load application.'); return; }

        if (data.application) {
          const a = data.application;
          setApplication({
            status:             a.status,
            submittedAt:        a.created_at,
            updatedAt:          a.updated_at,
            fullName:           a.name,
            icNumber:           a.ic_number,
            dob:                a.date_of_birth,
            gender:             a.gender,
            race:               a.race,
            maritalStatus:      a.marital_status,
            email:              a.email,
            phone:              a.phone,
            fullAddress:        a.full_address,
            postalCode:         a.postal_code,
            state:              a.state,
            hearAboutUs:        a.hear_about_us,
            interviewDatetime:  a.interview_datetime,
            venue:              a.venue,
            interviewerName:    a.interviewer_name,
            remarks:            a.remarks,
            selectedSlotDatetime: a.selected_slot_datetime,
            selectedSlotCapacity: a.selected_slot_capacity,
            education: (a.education || []).map((e) => ({
              institute:     e.institute_name,
              qualification: e.qualification,
              startDate:     e.start_date,
              endDate:       e.end_date,
            })),
          });
        }
      } catch {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, []);

  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <Layout activePage="my-application">
        <div className="af-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <span className="af-spinner" style={{ width: 28, height: 28 }} />
        </div>
      </Layout>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error) {
    return (
      <Layout activePage="my-application">
        <div className="af-content"><div className="af-card"><div className="ma-empty-state">
          <p className="ma-empty-title">Something went wrong</p>
          <p className="ma-empty-text">{error}</p>
        </div></div></div>
      </Layout>
    );
  }

  // ── No application ───────────────────────────────────────
  if (!application) {
    return (
      <Layout activePage="my-application">
        <div className="af-content">
          <div className="af-card">
            <div className="ma-empty-state">
              <p className="ma-empty-title">No Application Found</p>
              <p className="ma-empty-text">You haven't started an application yet. Click below to begin.</p>
              <button
                className="af-btn-next"
                style={{ marginTop: '24px' }}
                onClick={() => navigate('/application-form')}
              >
                Start Application
                <Icon d="M5 12h14M12 5l7 7-7 7" size={14} color="white" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const {
    status, submittedAt, updatedAt,
    fullName, dob, gender,
    email, phone, fullAddress, postalCode, state,
    hearAboutUs, education = [],
    selectedSlotDatetime,
  } = application;

  // const {
  //   status, submittedAt, updatedAt,
  //   fullName, icNumber, dob, gender, race, maritalStatus,
  //   email, phone, fullAddress, postalCode, state,
  //   hearAboutUs, education = [],
  //   selectedSlotDatetime,
  // } = application;

  const isDraft    = status?.toLowerCase() === 'draft';

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const subLabel = isDraft
    ? `Draft — last saved ${updatedAt ? fmt(updatedAt) : '—'}`
    : `Submitted ${submittedAt ? fmt(submittedAt) : '—'}`;

  return (
    <Layout activePage="my-application">
      <div className="af-content">

        {/* ── Page header ── */}
        <div className="ma-page-header">
          <div>
            <h1 className="ma-page-title">My Application</h1>
            <p className="ma-page-sub">{subLabel}</p>
          </div>
          <div className="ma-header-right">
            <StatusBadge status={status} />

          </div>
        </div>

        {/* ── Status notice ── */}
        <StatusNotice status={status} />

         {/* ── Interview Details (admin-assigned) — below Education ── */}
        <InterviewDetails application={application} />

        {/* ── Personal Information ── */}
        <div className="af-card ma-section-card">
          <div className="af-card-header ma-section-card-header">
            <div className="ma-section-heading">
              <div className="ma-section-icon">
                <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={15} color="#1a56db" />
              </div>
              <div>
                <p className="af-card-title">Personal Information</p>
                <p className="af-card-subtitle">Your submitted personal details</p>
              </div>
            </div>
          </div>
          <div className="af-card-body">
            <div className="af-form-grid">
              <FormSeparator title="Basic Information" />
              <ReadField label="Full Name"      value={fullName}   fullWidth />
              {/* <ReadField label="IC Number"      value={icNumber}   fullWidth /> */}
              <ReadField label="Date of Birth"  value={fmt(dob)} />

              {/* <FormSeparator title="Demographic Information" /> */}
              <ReadField label="Gender"         value={capitalize(gender)} />
              {/* <ReadField label="Race"           value={capitalize(race)} />
              <ReadField label="Marital Status" value={capitalize(maritalStatus)} /> */}

              <FormSeparator title="Contact & Address" />
              <ReadField label="Email Address"  value={email} />
              <ReadField label="Phone Number"   value={phone} />
              <ReadField label="Full Address"   value={fullAddress} fullWidth />
              <ReadField label="Postal Code"    value={postalCode} />
              <ReadField label="State"          value={state} />

            </div>
          </div>
        </div>

        {/* ── Education ── */}
        <div className="af-card ma-section-card">
          <div className="af-card-header ma-section-card-header">
            <div className="ma-section-heading">
              <div className="ma-section-icon">
                <Icon d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3.33 1.67 8.67 1.67 12 0v-5" size={15} color="#1a56db" />
              </div>
              <div>
                <p className="af-card-title">Education</p>
                <p className="af-card-subtitle">Your educational background</p>
              </div>
            </div>
          </div>
          <div className="af-card-body" style={{ padding: 0 }}>
            <div className="af-table-wrap" style={{ borderRadius: 0, border: 'none' }}>
              <table className="af-table">
                <thead>
                  <tr>
                    <th>Institute Name</th>
                    <th>Qualification</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {education.length === 0
                    ? <tr><td colSpan={4} className="af-empty">No education records found</td></tr>
                    : education.map((row, i) => (
                      <tr key={i}>
                        <td className="ma-td">{row.institute     || '—'}</td>
                        <td className="ma-td">{row.qualification || '—'}</td>
                        <td className="ma-td">{fmt(row.startDate)}</td>
                        <td className="ma-td">{fmt(row.endDate)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Additional Information ── */}
        {(selectedSlotDatetime || hearAboutUs) && (
          <div className="af-card ma-section-card">
            <div className="af-card-header ma-section-card-header">
              <div className="ma-section-heading">
                <div className="ma-section-icon">
                  <Icon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={15} color="#1a56db" />
                </div>
                <div>
                  <p className="af-card-title">Interview & Additional Information</p>
                  <p className="af-card-subtitle">Your preferred interview slot and additional details</p>
                </div>
              </div>
            </div>
            <div className="af-card-body">
              <div className="af-form-grid">
                <FormSeparator title="Interview Slot" />
                {selectedSlotDatetime && (
                  <div className="af-col-full">
                    <SelectedSlotCard
                      datetime={selectedSlotDatetime}
                    />
                  </div>
                )}
                <FormSeparator title="Additional Information" />
                {hearAboutUs && (
                  <ReadField
                    label="How Did You Hear About Us"
                    value={HEAR_ABOUT_MAP[hearAboutUs] || hearAboutUs}
                    fullWidth
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Edit button — right-aligned, directly below Education ── */}
        {isDraft && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button
              className="af-btn-next ma-edit-btn"
              onClick={() => navigate('/application-form')}
              type="button"
            >
              <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={14} color="white" />
              Continue Editing
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
}