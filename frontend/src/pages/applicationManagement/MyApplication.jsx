import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../css/dashboard/applicantDashboard.css";
import "../../css/applicationManagement/applicationForm.css";
import "../../css/applicationManagement/myApplication.css";
import Layout from '../../components/dashboard/Layout';

const API       = process.env.REACT_APP_API_URL;
const getToken  = () => localStorage.getItem('token');

function Icon({ d, size = 14, color = 'currentColor', sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const STATUS_MAP = {
  pending:            { label: 'Pending',              bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  under_review:       { label: 'Under Review',         bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  interview:          { label: 'Interview',            bg: '#f3e8ff', color: '#6b21a8', dot: '#8b5cf6' },
  approved:           { label: 'Approved',             bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  accepted:           { label: 'Accepted',             bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  rejected_review:    { label: 'Rejected (Review)',    bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  rejected_interview: { label: 'Rejected (Interview)', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  withdraw:           { label: 'Withdrawn',            bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
};

function StatusBadge({ status }) {
  const key = status?.toLowerCase();
  const s   = STATUS_MAP[key] || STATUS_MAP.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: '700', padding: '4px 10px',
      borderRadius: '20px', letterSpacing: '0.3px',
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

function ProficiencyPill({ level }) {
  const map = {
    Beginner:     'ma-pill-beginner',
    Intermediate: 'ma-pill-intermediate',
    Advanced:     'ma-pill-advanced',
    Expert:       'ma-pill-expert',
  };
  if (!level) return <span className="ma-empty-val">—</span>;
  return <span className={`ma-pill ${map[level] || ''}`}>{level}</span>;
}

function StatusNotice({ status }) {
  const key = status?.toLowerCase();
  const notices = {
    approved: {
      type: 'success',
      icon: 'M20 6L9 17l-5-5',
      msg:  'Congratulations! Your application has been approved. Please confirm your decision below.',
    },
    accepted: {
      type: 'success',
      icon: 'M20 6L9 17l-5-5',
      msg:  'You have accepted the offer. Welcome aboard! Our team will be in touch shortly.',
    },
    interview: {
      type: 'info',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
      msg:  'You have been invited for an interview. Please check the interview details below.',
    },
    under_review: {
      type: 'info',
      icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3',
      msg:  'Your application is currently under review. We will notify you once a decision has been made.',
    },
    rejected_review: {
      type: 'error',
      icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
      msg:  'Unfortunately your application was unsuccessful at the review stage. Please contact us if you have any questions.',
    },
    rejected_interview: {
      type: 'error',
      icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
      msg:  'Thank you for attending the interview. Unfortunately your application was unsuccessful at this stage.',
    },
    withdraw: {
      type: 'warning',
      icon: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      msg:  'Your application has been withdrawn. Contact us if you believe this was done in error.',
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
      fontSize: '13px', fontWeight: '500',
    }}>
      <Icon d={notice.icon} size={15} color={t.color} />
      {notice.msg}
    </div>
  );
}

// ── Accept / Decline buttons ───────────────────────────────
function OfferActions({ onAccept, onWithdraw, loading }) {
  return (
    <div style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      borderRadius: '12px', padding: '20px', marginBottom: '20px',
    }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#166534', margin: '0 0 4px' }}>
        Action Required
      </p>
      <p style={{ fontSize: '12px', color: '#15803d', margin: '0 0 16px' }}>
        Accepting will upgrade your account to Student and you will need to log in again to access the student portal.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onAccept}
          disabled={!!loading}
          style={{
            flex: 1, padding: '11px 16px', borderRadius: '8px', border: 'none',
            background: '#16a34a', color: 'white',
            fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Icon d="M20 6L9 17l-5-5" size={13} color="white" />
          {loading === 'accept' ? 'Processing…' : 'Accept Offer'}
        </button>
        <button
          onClick={onWithdraw}
          disabled={!!loading}
          style={{
            flex: 1, padding: '11px 16px', borderRadius: '8px',
            border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626',
            fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Icon d="M18 6L6 18M6 6l12 12" size={13} color="#dc2626" />
          {loading === 'withdraw' ? 'Processing…' : 'Decline Offer'}
        </button>
      </div>
    </div>
  );
}

function InterviewDetails({ application }) {
  const showStatuses = ['interview', 'rejected_interview', 'approved', 'accepted', 'withdraw'];
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
            <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={15} color="#7c3aed" />
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

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function MyApplication() {
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [offerLoading, setOfferLoading] = useState(null);

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
            avatar:             a.avatar_url ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001') + a.avatar_url : null,
            fullName:           a.name,
            icNumber:           a.ic_number,
            dob:                a.date_of_birth,
            gender:             a.gender,
            race:               a.race,
            maritalStatus:      a.marital_status,
            email:              a.email,
            phone:              a.phone,
            streetAddress:      a.street_address,
            city:               a.city,
            postalCode:         a.postal_code,
            state:              a.state,
            country:            a.country,
            interviewDatetime:  a.interview_datetime,
            venue:              a.venue,
            interviewerName:    a.interviewer_name,
            remarks:            a.remarks,
            education: (a.education || []).map((e) => ({
              institute:     e.institute_name,
              qualification: e.qualification,
              major:         e.major,
              startDate:     e.start_date,
              endDate:       e.end_date,
            })),
            skills: (a.skills || []).map((s) => ({
              skillName:   s.skill_name,
              proficiency: s.proficiency,
            })),
          });
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, []);

  const handleAccept = async () => {
    if (!window.confirm('Accept this offer? Your account will be upgraded to Student and you will need to log in again.')) return;
    setOfferLoading('accept');
    try {
      const res  = await fetch(`${API}/my-application/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Failed to accept offer.');
    } finally {
      setOfferLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to decline this offer? This cannot be undone.')) return;
    setOfferLoading('withdraw');
    try {
      const res  = await fetch(`${API}/my-application/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setApplication((prev) => ({ ...prev, status: 'withdraw' }));
    } catch (err) {
      alert(err.message || 'Failed to withdraw.');
    } finally {
      setOfferLoading(null);
    }
  };

  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <Layout activePage="my-application">
        <div className="af-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <span className="af-spinner" style={{ width: 28, height: 28 }} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout activePage="my-application">
        <div className="af-content"><div className="af-card"><div className="ma-empty-state">
          <span className="ma-empty-icon">⚠️</span>
          <p className="ma-empty-title">Something went wrong</p>
          <p className="ma-empty-text">{error}</p>
        </div></div></div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout activePage="my-application">
        <div className="af-content"><div className="af-card"><div className="ma-empty-state">
          <span className="ma-empty-icon">📋</span>
          <p className="ma-empty-title">No Application Found</p>
          <p className="ma-empty-text">You haven't submitted an application yet.</p>
        </div></div></div>
      </Layout>
    );
  }

  const {
    status, submittedAt, avatar,
    fullName, icNumber, dob, gender, race, maritalStatus,
    email, phone, streetAddress, city, postalCode, state, country,
    education = [], skills = [],
  } = application;

  const isPending    = status?.toLowerCase() === 'pending';
  const isApproved   = status?.toLowerCase() === 'approved';

  return (
    <Layout activePage="my-application">
      <div className="af-content">

        {/* ── Page header ── */}
        <div className="ma-page-header">
          <div>
            <h1 className="ma-page-title">My Application</h1>
            <p className="ma-page-sub">Submitted {submittedAt ? fmt(submittedAt) : '—'}</p>
          </div>
          <div className="ma-header-right">
            <StatusBadge status={status} />
            {isPending && (
              <button className="af-btn-next ma-edit-btn" onClick={() => navigate('/application-form')} type="button">
                <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={13} color="white" />
                Edit Application
              </button>
            )}
          </div>
        </div>

        {/* ── Status notice ── */}
        <StatusNotice status={status} />

        {/* ── Accept / Decline buttons — only shown when approved ── */}
        {isApproved && (
          <OfferActions
            onAccept={handleAccept}
            onWithdraw={handleWithdraw}
            loading={offerLoading}
          />
        )}

        {/* ── Interview details ── */}
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
            {avatar && (
              <div className="af-avatar-section ma-avatar-view">
                <div className="af-avatar-circle"><img src={avatar} alt="Profile" /></div>
              </div>
            )}
            <div className="af-form-grid">
              <ReadField label="Full Name"      value={fullName}      fullWidth />
              <ReadField label="IC Number"      value={icNumber}      fullWidth />
              <ReadField label="Date of Birth"  value={fmt(dob)} />
              <ReadField label="Gender"         value={gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : ''} />
              <ReadField label="Race"           value={race   ? race.charAt(0).toUpperCase()   + race.slice(1)   : ''} />
              <ReadField label="Marital Status" value={maritalStatus ? maritalStatus.charAt(0).toUpperCase() + maritalStatus.slice(1) : ''} />
              <ReadField label="Email Address"  value={email} />
              <ReadField label="Phone Number"   value={phone} />
              <ReadField label="Street Address" value={streetAddress} fullWidth />
              <ReadField label="City"           value={city} />
              <ReadField label="Postal Code"    value={postalCode} />
              <ReadField label="State"          value={state} />
              <ReadField label="Country"        value={country} />
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
                  <tr><th>Institute Name</th><th>Qualification</th><th>Major</th><th>Start Date</th><th>End Date</th></tr>
                </thead>
                <tbody>
                  {education.length === 0
                    ? <tr><td colSpan={5} className="af-empty">No education records found</td></tr>
                    : education.map((row, i) => (
                      <tr key={i}>
                        <td className="ma-td">{row.institute     || '—'}</td>
                        <td className="ma-td">{row.qualification || '—'}</td>
                        <td className="ma-td">{row.major         || '—'}</td>
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

        {/* ── Skills ── */}
        <div className="af-card ma-section-card">
          <div className="af-card-header ma-section-card-header">
            <div className="ma-section-heading">
              <div className="ma-section-icon">
                <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" size={15} color="#1a56db" />
              </div>
              <div>
                <p className="af-card-title">Skills</p>
                <p className="af-card-subtitle">Your listed skills and proficiency levels</p>
              </div>
            </div>
          </div>
          <div className="af-card-body" style={{ padding: 0 }}>
            <div className="af-table-wrap" style={{ borderRadius: 0, border: 'none' }}>
              <table className="af-table">
                <thead>
                  <tr><th>Skill Name</th><th>Proficiency</th></tr>
                </thead>
                <tbody>
                  {skills.length === 0
                    ? <tr><td colSpan={2} className="af-empty">No skills listed</td></tr>
                    : skills.map((row, i) => (
                      <tr key={i}>
                        <td className="ma-td">{row.skillName || '—'}</td>
                        <td className="ma-td"><ProficiencyPill level={row.proficiency} /></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}