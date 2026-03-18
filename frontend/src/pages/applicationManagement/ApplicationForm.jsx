import { useState, useRef, useEffect, useCallback } from 'react';
import "../../css/applicationManagement/applicationForm.css";
import Layout from '../../components/dashboard/Layout';

const API = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem('token');

// ── Icons ──────────────────────────────────────────────────
function Icon({ d, size = 14, color = 'currentColor', sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`af-toast ${type}`}>
      <Icon d={type === 'success' ? 'M20 6L9 17l-5-5' : 'M18 6L6 18M6 6l12 12'} color="white" sw={2.5} />
      {msg}
    </div>
  );
}

// ── Unique ID helper for dynamic rows ──────────────────────
let _uid = 0;
const uid = () => `row_${++_uid}`;

// ── Empty row factories ────────────────────────────────────
const newEdu   = () => ({ _id: uid(), institute: '', qualification: '', major: '', startDate: '', endDate: '' });
const newSkill = () => ({ _id: uid(), skillName: '', proficiency: '' });

// ══════════════════════════════════════════════════════════
// STEP 1 – Personal Information
// ══════════════════════════════════════════════════════════
function StepPersonal({ data, onChange, avatarPreview, onAvatarChange, errors }) {
  const fileRef = useRef();
  const set = (field) => (e) => onChange({ ...data, [field]: e.target.value });

  return (
    <>
      <div className="af-avatar-section">
        <div className="af-avatar-upload" onClick={() => fileRef.current?.click()} title="Upload photo">
          <div className="af-avatar-circle">
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" />
              : (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                </svg>
              )
            }
          </div>
          <div className="af-avatar-edit">
            <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={10} color="white" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files[0]; if (f) onAvatarChange(f); }} />
        </div>
      </div>

      <div className="af-form-grid">
        <div className="af-field af-col-full">
          <label className="af-label">Full Name<span className="af-required">*</span></label>
          <input className={`af-input ${errors.fullName ? 'error' : ''}`} value={data.fullName}
            onChange={set('fullName')} placeholder="e.g. Ahmad Faris bin Abdullah" />
          {errors.fullName && <p className="af-field-error">{errors.fullName}</p>}
        </div>

        <div className="af-field af-col-full">
          <label className="af-label">IC Number<span className="af-required">*</span></label>
          <input className={`af-input ${errors.icNumber ? 'error' : ''}`} value={data.icNumber}
            onChange={set('icNumber')} placeholder="e.g. 990101-01-1234" />
          {errors.icNumber && <p className="af-field-error">{errors.icNumber}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Date of Birth<span className="af-required">*</span></label>
          <input type="date" className={`af-input ${errors.dob ? 'error' : ''}`}
            value={data.dob} onChange={set('dob')} />
          {errors.dob && <p className="af-field-error">{errors.dob}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Gender<span className="af-required">*</span></label>
          <select className={`af-select ${errors.gender ? 'error' : ''}`} value={data.gender} onChange={set('gender')}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.gender && <p className="af-field-error">{errors.gender}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Race<span className="af-required">*</span></label>
          <select className={`af-select ${errors.race ? 'error' : ''}`} value={data.race} onChange={set('race')}>
            <option value="">Select race</option>
            <option value="malay">Malay</option>
            <option value="chinese">Chinese</option>
            <option value="indian">Indian</option>
            <option value="others">Others</option>
          </select>
          {errors.race && <p className="af-field-error">{errors.race}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Marital Status<span className="af-required">*</span></label>
          <select className={`af-select ${errors.maritalStatus ? 'error' : ''}`} value={data.maritalStatus} onChange={set('maritalStatus')}>
            <option value="">Select status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
          {errors.maritalStatus && <p className="af-field-error">{errors.maritalStatus}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Email Address<span className="af-required">*</span></label>
          <input type="email" className={`af-input ${errors.email ? 'error' : ''}`}
            value={data.email} onChange={set('email')} placeholder="email@example.com" />
          {errors.email && <p className="af-field-error">{errors.email}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Phone Number<span className="af-required">*</span></label>
          <input className={`af-input ${errors.phone ? 'error' : ''}`}
            value={data.phone} onChange={set('phone')} placeholder="e.g. 012-3456789" />
          {errors.phone && <p className="af-field-error">{errors.phone}</p>}
        </div>

        <div className="af-field af-col-full">
          <label className="af-label">Street Address<span className="af-required">*</span></label>
          <input className={`af-input ${errors.streetAddress ? 'error' : ''}`}
            value={data.streetAddress} onChange={set('streetAddress')} placeholder="Street address" />
          {errors.streetAddress && <p className="af-field-error">{errors.streetAddress}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">City<span className="af-required">*</span></label>
          <input className={`af-input ${errors.city ? 'error' : ''}`}
            value={data.city} onChange={set('city')} placeholder="e.g. Penang" />
          {errors.city && <p className="af-field-error">{errors.city}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Postal Code<span className="af-required">*</span></label>
          <input className={`af-input ${errors.postalCode ? 'error' : ''}`}
            value={data.postalCode} onChange={set('postalCode')} placeholder="e.g. 11700" />
          {errors.postalCode && <p className="af-field-error">{errors.postalCode}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">State<span className="af-required">*</span></label>
          <select className={`af-select ${errors.state ? 'error' : ''}`} value={data.state} onChange={set('state')}>
            <option value="">Select state</option>
            {['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang',
              'Penang','Perak','Perlis','Sabah','Sarawak','Selangor',
              'Terengganu','Kuala Lumpur','Labuan','Putrajaya'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="af-field-error">{errors.state}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Country<span className="af-required">*</span></label>
          <input className={`af-input ${errors.country ? 'error' : ''}`}
            value={data.country} onChange={set('country')} placeholder="e.g. Malaysia" />
          {errors.country && <p className="af-field-error">{errors.country}</p>}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════
// STEP 2 – Education & Skills
// ══════════════════════════════════════════════════════════
function StepEduSkills({ education, skills, onEduChange, onSkillChange }) {
  const addEdu   = () => onEduChange([...education, newEdu()]);
  const delEdu   = (id) => onEduChange(education.filter((r) => r._id !== id));
  const setEdu   = (id, field, val) => onEduChange(education.map((r) => r._id === id ? { ...r, [field]: val } : r));

  const addSkill   = () => onSkillChange([...skills, newSkill()]);
  const delSkill   = (id) => onSkillChange(skills.filter((r) => r._id !== id));
  const setSkill   = (id, field, val) => onSkillChange(skills.map((r) => r._id === id ? { ...r, [field]: val } : r));

  return (
    <>
      <div className="af-section">
        <div className="af-section-header">
          <div>
            <p className="af-section-title">Education</p>
            <p className="af-section-subtitle">Please provide your educational background</p>
          </div>
          <button className="af-btn-add" onClick={addEdu} type="button">
            <Icon d="M12 5v14M5 12h14" size={13} color="white" />
            Add Education
          </button>
        </div>
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Institute Name</th><th>Qualification</th><th>Major</th>
                <th>Start Date</th><th>End Date</th><th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {education.length === 0
                ? <tr><td colSpan={6} className="af-empty">No data found</td></tr>
                : education.map((row) => (
                  <tr key={row._id}>
                    <td><input className="af-table-input" value={row.institute}
                      onChange={(e) => setEdu(row._id, 'institute', e.target.value)}
                      placeholder="e.g. Universiti Teknologi Malaysia" /></td>
                    <td>
                      <select className="af-table-select" value={row.qualification}
                        onChange={(e) => setEdu(row._id, 'qualification', e.target.value)}>
                        <option value="">Select</option>
                        <option>SPM</option><option>Diploma</option>
                        <option>Bachelor's Degree</option><option>Master's Degree</option>
                        <option>PhD</option><option>Others</option>
                      </select>
                    </td>
                    <td><input className="af-table-input" value={row.major}
                      onChange={(e) => setEdu(row._id, 'major', e.target.value)}
                      placeholder="e.g. Computer Science" /></td>
                    <td><input type="date" className="af-table-input" value={row.startDate}
                      onChange={(e) => setEdu(row._id, 'startDate', e.target.value)} /></td>
                    <td><input type="date" className="af-table-input" value={row.endDate}
                      onChange={(e) => setEdu(row._id, 'endDate', e.target.value)} /></td>
                    <td>
                      <button className="af-row-del" onClick={() => delEdu(row._id)} type="button" title="Remove">
                        <Icon d="M18 6L6 18M6 6l12 12" size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="af-section">
        <div className="af-section-header">
          <div>
            <p className="af-section-title">Skills</p>
            <p className="af-section-subtitle">Please provide your additional skills</p>
          </div>
          <button className="af-btn-add" onClick={addSkill} type="button">
            <Icon d="M12 5v14M5 12h14" size={13} color="white" />
            Add Skills
          </button>
        </div>
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr><th>Skills Name</th><th>Proficiency</th><th style={{ width: 40 }}></th></tr>
            </thead>
            <tbody>
              {skills.length === 0
                ? <tr><td colSpan={3} className="af-empty">No data found</td></tr>
                : skills.map((row) => (
                  <tr key={row._id}>
                    <td><input className="af-table-input" value={row.skillName}
                      onChange={(e) => setSkill(row._id, 'skillName', e.target.value)}
                      placeholder="e.g. React.js" /></td>
                    <td>
                      <select className="af-table-select" value={row.proficiency}
                        onChange={(e) => setSkill(row._id, 'proficiency', e.target.value)}>
                        <option value="">Select</option>
                        <option>Beginner</option><option>Intermediate</option>
                        <option>Advanced</option><option>Expert</option>
                      </select>
                    </td>
                    <td>
                      <button className="af-row-del" onClick={() => delSkill(row._id)} type="button" title="Remove">
                        <Icon d="M18 6L6 18M6 6l12 12" size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function ApplicationForm() {
  const [step, setStep] = useState(1);

  const [personal, setPersonal] = useState({
    fullName: '', icNumber: '', dob: '', gender: '',
    race: '', maritalStatus: '', email: '', phone: '',
    streetAddress: '', city: '', postalCode: '', state: '', country: 'Malaysia',
  });
  const [errors, setErrors]               = useState({});
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [education, setEducation]         = useState([]);
  const [skills, setSkills]               = useState([]);
  const [submitting, setSubmitting]       = useState(false);
  const [submitAlert, setSubmitAlert]     = useState(null);
  const [submitted, setSubmitted]         = useState(false);
  const [toast, setToast]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  // ── Load existing application on mount ──────────────────
  useEffect(() => {
    const fetchMyApplication = async () => {
      try {
        const res  = await fetch(`${API}/my-application`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (res.ok && data.application) {
          const a = data.application;
          setPersonal({
            fullName:      a.name      || '',
            icNumber:      a.ic_number      || '',
            dob:           a.date_of_birth  ? a.date_of_birth.split('T')[0] : '',
            gender:        a.gender         || '',
            race:          a.race           || '',
            maritalStatus: a.marital_status || '',
            email:         a.email          || '',
            phone:         a.phone          || '',
            streetAddress: a.street_address || '',
            city:          a.city           || '',
            postalCode:    a.postal_code    || '',
            state:         a.state          || '',
            country:       a.country        || 'Malaysia',
          });
          if (a.avatar_url) setAvatarPreview((process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001') + a.avatar_url);
          if (a.education?.length)
            setEducation(a.education.map((e) => ({
              _id:           uid(),
              institute:     e.institute_name || '',
              qualification: e.qualification  || '',
              major:         e.major          || '',
              startDate:     e.start_date ? e.start_date.split('T')[0] : '',
              endDate:       e.end_date   ? e.end_date.split('T')[0]   : '',
            })));
          if (a.skills?.length)
            setSkills(a.skills.map((s) => ({
              _id:         uid(),
              skillName:   s.skill_name   || '',
              proficiency: s.proficiency  || '',
            })));
        }
      } catch (err) {
        console.error('Failed to load application:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyApplication();
  }, []);

  const handleAvatarChange = (file) => {
    if (file.size > 3 * 1024 * 1024) { showToast('Image must be under 3 MB.', 'error'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validateStep1 = () => {
    const required = {
      fullName: 'Full name is required.', icNumber: 'IC number is required.',
      dob: 'Date of birth is required.', gender: 'Please select a gender.',
      race: 'Please select a race.', maritalStatus: 'Please select marital status.',
      email: 'Email is required.', phone: 'Phone number is required.',
      streetAddress: 'Street address is required.', city: 'City is required.',
      postalCode: 'Postal code is required.', state: 'State is required.',
      country: 'Country is required.',
    };
    const errs = {};
    Object.entries(required).forEach(([k, msg]) => { if (!personal[k]?.trim()) errs[k] = msg; });
    if (personal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email))
      errs.email = 'Enter a valid email address.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) { showToast('Please fill in all required fields.', 'error'); return; }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleBack = () => { setStep(1); window.scrollTo(0, 0); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitAlert(null);
    try {
      const formData = new FormData();
      Object.entries(personal).forEach(([k, v]) => formData.append(k, v));
      if (avatarFile) formData.append('avatar', avatarFile);
      formData.append('education', JSON.stringify(education.map(({ _id, ...rest }) => rest)));
      formData.append('skills', JSON.stringify(skills.map(({ _id, ...rest }) => rest)));

      const res  = await fetch(`${API}/application-form`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitAlert({ type: 'error', msg: data.message || 'Submission failed. Please try again.' });
        return;
      }
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch {
      setSubmitAlert({ type: 'error', msg: 'Network error. Please check your connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  const StepIndicator = () => (
    <div className="af-steps">
      <div className="af-step">
        <div className={`af-step-dot ${step === 1 ? 'active' : 'done'}`}>
          {step > 1 ? <Icon d="M20 6L9 17l-5-5" size={12} color="white" sw={2.5} /> : '1'}
        </div>
        <span className={`af-step-label ${step === 1 ? 'active' : 'done'}`}>Personal Information</span>
      </div>
      <div className={`af-step-line ${step > 1 ? 'done' : ''}`} />
      <div className="af-step">
        <div className={`af-step-dot ${step === 2 ? 'active' : ''}`}>2</div>
        <span className={`af-step-label ${step === 2 ? 'active' : ''}`}>Education & Skills</span>
      </div>
    </div>
  );

  // ── Loading screen ───────────────────────────────────────
  if (loading) {
    return (
      <Layout activePage="application">
        <div className="af-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <span className="af-spinner" style={{ width: 28, height: 28 }} />
        </div>
      </Layout>
    );
  }

  // ── Submitted success screen ─────────────────────────────
  if (submitted) {
    return (
      <Layout activePage="application">           {/* ← your Layout handles sidebar + topbar */}
        <div className="af-content">
          <div className="af-card">
            <div className="af-success-wrap">
              <span className="af-success-icon">🎉</span>
              <p className="af-success-title">Application Submitted!</p>
              <p className="af-success-text">
                Your application has been received successfully.
                Our team will review it and get back to you soon.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Main render ──────────────────────────────────────────
  return (
    <Layout activePage="application">             {/* ← your Layout handles sidebar + topbar */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="af-content">
        <StepIndicator />

        <div className="af-card">
          <div className="af-card-header">
            {step === 1
              ? <><p className="af-card-title">Personal Information</p>
                  <p className="af-card-subtitle">Please provide your contact details</p></>
              : <><p className="af-card-title">Education & Skills</p>
                  <p className="af-card-subtitle">Please provide your educational background and skills</p></>
            }
          </div>

          <div className="af-card-body">
            {step === 1 && (
              <StepPersonal
                data={personal} onChange={setPersonal}
                avatarPreview={avatarPreview} onAvatarChange={handleAvatarChange}
                errors={errors}
              />
            )}
            {step === 2 && (
              <>
                {submitAlert && (
                  <div className={`af-alert ${submitAlert.type}`}>
                    <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={14} />
                    {submitAlert.msg}
                  </div>
                )}
                <StepEduSkills
                  education={education} skills={skills}
                  onEduChange={setEducation} onSkillChange={setSkills}
                />
              </>
            )}
          </div>

          <div className="af-form-footer">
            {step === 2 && (
              <button className="af-btn-back" onClick={handleBack} disabled={submitting}>Back</button>
            )}
            {step === 1 && (
              <button className="af-btn-next" onClick={handleNext}>
                Next <Icon d="M5 12h14M12 5l7 7-7 7" size={14} color="white" />
              </button>
            )}
            {step === 2 && (
              <button className="af-btn-next" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <><span className="af-spinner" /> Submitting…</>
                  : <>Submit <Icon d="M20 6L9 17l-5-5" size={14} color="white" /></>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}