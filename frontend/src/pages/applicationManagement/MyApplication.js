import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../css/dashboard/applicantDashboard.css";
import "../../css/applicationManagement/applicationForm.css";
import "../../css/applicationManagement/myApplication.css";
import Layout from '../../components/dashboard/Layout';

const API       = process.env.REACT_APP_API_URL;
const getToken  = () => localStorage.getItem('token');

// ── Icon helper ────────────────────────────────────────────
function Icon({ d, size = 14, color = 'currentColor', sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:      { label: 'Pending',      cls: 'ma-badge-pending'  },
    approved:     { label: 'Approved',     cls: 'ma-badge-approved' },
    rejected:     { label: 'Rejected',     cls: 'ma-badge-rejected' },
    under_review: { label: 'Under Review', cls: 'ma-badge-pending'  },
  };
  const s = map[status?.toLowerCase()] || map.pending;
  return <span className={`ma-badge ${s.cls}`}>{s.label}</span>;
}

// ── Read-only field ────────────────────────────────────────
function ReadField({ label, value, fullWidth = false }) {
  return (
    <div className={`af-field${fullWidth ? ' af-col-full' : ''}`}>
      <label className="af-label">{label}</label>
      <p className="ma-read-value">{value || <span className="ma-empty-val">—</span>}</p>
    </div>
  );
}

// ── Proficiency pill ───────────────────────────────────────
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

// ══════════════════════════════════════════════════════════
// Main Component — fetches its own data
// ══════════════════════════════════════════════════════════
export default function MyApplication() {
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // ── Fetch on mount ───────────────────────────────────────
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res  = await fetch(`${API}/my-application`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Failed to load application.');
          return;
        }

        if (data.application) {
          const a = data.application;
          // Map DB column names → friendly field names
          setApplication({
            status:        a.status,
            submittedAt:   a.created_at,
            avatar: a.avatar_url ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001') + a.avatar_url : null,
            fullName:      a.full_name,
            icNumber:      a.ic_number,
            dob:           a.date_of_birth,
            gender:        a.gender,
            race:          a.race,
            maritalStatus: a.marital_status,
            email:         a.email,
            phone:         a.phone,
            streetAddress: a.street_address,
            city:          a.city,
            postalCode:    a.postal_code,
            state:         a.state,
            country:       a.country,
            // Education: map DB columns → component fields
            education: (a.education || []).map((e) => ({
              institute:     e.institute_name,
              qualification: e.qualification,
              major:         e.major,
              startDate:     e.start_date,
              endDate:       e.end_date,
            })),
            // Skills: map DB columns → component fields
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
        <div className="af-content">
          <div className="af-card">
            <div className="ma-empty-state">
              <span className="ma-empty-icon">⚠️</span>
              <p className="ma-empty-title">Something went wrong</p>
              <p className="ma-empty-text">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── No application yet ───────────────────────────────────
  if (!application) {
    return (
      <Layout activePage="my-application">
        <div className="af-content">
          <div className="af-card">
            <div className="ma-empty-state">
              <span className="ma-empty-icon">📋</span>
              <p className="ma-empty-title">No Application Found</p>
              <p className="ma-empty-text">You haven't submitted an application yet.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const {
    status, submittedAt, avatar,
    fullName, icNumber, dob, gender, race, maritalStatus,
    email, phone, streetAddress, city, postalCode, state, country,
    education = [], skills = [],
  } = application;

  const isPending = status?.toLowerCase() === 'pending';

  return (
    <Layout activePage="my-application">
      <div className="af-content">

        {/* ── Page header ───────────────────────────────── */}
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

        {/* ── Status notices ────────────────────────────── */}
        {status?.toLowerCase() === 'rejected' && (
          <div className="af-alert error ma-notice">
            <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={14} />
            Your application was not successful this time. Please contact us if you have any questions.
          </div>
        )}
        {status?.toLowerCase() === 'approved' && (
          <div className="af-alert success ma-notice">
            <Icon d="M20 6L9 17l-5-5" size={14} />
            Congratulations! Your application has been approved. Our team will be in touch with you shortly.
          </div>
        )}

        {/* ── Personal Information ──────────────────────── */}
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
                <div className="af-avatar-circle">
                  <img src={avatar} alt="Profile" />
                </div>
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

        {/* ── Education ─────────────────────────────────── */}
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
                    <th>Institute Name</th><th>Qualification</th><th>Major</th>
                    <th>Start Date</th><th>End Date</th>
                  </tr>
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

        {/* ── Skills ────────────────────────────────────── */}
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