import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
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
const newEdu = () => ({ _id: uid(), institute: '', qualification: '', startDate: '', endDate: '' });

// // ── IC Number auto-formatter ───────────────────────────────
// const formatIC = (raw) => {
//   const d = raw.replace(/\D/g, '').slice(0, 12);
//   if (d.length <= 6)  return d;
//   if (d.length <= 8)  return `${d.slice(0, 6)}-${d.slice(6)}`;
//   return `${d.slice(0, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
// };

export function FormSeparator({ title }) {
  return (
    <div className="af-form-separator af-col-full">
      <span className="af-form-separator-label">{title}</span>
      <div className="af-form-separator-line" />
    </div>
  );
}

// ── How did you hear about us – options ────────────────────
const HEAR_ABOUT_OPTIONS = [
  { value: '',                label: 'Select an option' },
  { value: 'social_tiktok',   label: 'Social Media – TikTok' },
  { value: 'social_instagram',label: 'Social Media – Instagram' },
  { value: 'social_facebook', label: 'Social Media – Facebook' },
  { value: 'friends_family',  label: 'Friends / Family Recommendation' },
  { value: 'school_teacher',  label: 'School Teacher / Counsellor Recommendation' },
  { value: 'vitrox_website',  label: "ViTrox TVET's Website" },
  { value: 'events',          label: 'Events (Education / Career Fair, School Visit)' },
];


// ══════════════════════════════════════════════════════════
// STEP 1 – Personal Information
// ══════════════════════════════════════════════════════════
function StepPersonal({ data, onChange, errors, onFieldChange }) {
  const set = (field) => (e) => onFieldChange(field, e.target.value);

  return (
    <>
      <div className="af-form-grid">

        {/* ── Basic Information ── */}
        <FormSeparator title="Basic Information" />

        <div className="af-field af-col-full">
          <label className="af-label">
            Full Name
            <span style={{ marginLeft: 8, fontSize: 14, color: '#5a6f8a', fontWeight: 500 }}>
              (from your account)
            </span>
          </label>
          <input
            className="af-input"
            value={data.fullName}
            readOnly
            style={{ background: '#f4f6f9', cursor: 'not-allowed', color: '#5a6f8a' }}
          />
        </div>

        {/* <div className="af-field af-col-full">
          <label className="af-label">IC Number<span className="af-required">*</span></label>
          <input
            className={`af-input ${errors.icNumber ? 'error' : ''}`}
            value={data.icNumber}
            onChange={(e) => onFieldChange('icNumber', formatIC(e.target.value))}
            placeholder="e.g. 990101-01-1234"
            inputMode="numeric"
            maxLength={14}
          />
          {errors.icNumber && <p className="af-field-error">{errors.icNumber}</p>}
        </div> */}

        <div className="af-field">
          <label className="af-label">Date of Birth<span className="af-required">*</span></label>
          <input
            type="date"
            className={`af-input ${errors.dob ? 'error' : ''}`}
            value={data.dob}
            onChange={(e) => onFieldChange('dob', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dob && <p className="af-field-error">{errors.dob}</p>}
        </div>

        {/* ── Demographic Information ── */}
        {/* <FormSeparator title="Demographic Information" /> */}

        <div className="af-field">
          <label className="af-label">Gender<span className="af-required">*</span></label>
          <select className={`af-select ${errors.gender ? 'error' : ''}`} value={data.gender} onChange={set('gender')}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.gender && <p className="af-field-error">{errors.gender}</p>}
        </div>

        {/* <div className="af-field">
          <label className="af-label">Race<span className="af-required">*</span></label>
          <select className={`af-select ${errors.race ? 'error' : ''}`} value={data.race} onChange={set('race')}>
            <option value="">Select race</option>
            <option value="malay">Malay</option>
            <option value="chinese">Chinese</option>
            <option value="indian">Indian</option>
            <option value="others">Others</option>
          </select>
          {errors.race && <p className="af-field-error">{errors.race}</p>}
        </div> */}

        {/* <div className="af-field">
          <label className="af-label">Marital Status<span className="af-required">*</span></label>
          <select className={`af-select ${errors.maritalStatus ? 'error' : ''}`} value={data.maritalStatus} onChange={set('maritalStatus')}>
            <option value="">Select status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
          {errors.maritalStatus && <p className="af-field-error">{errors.maritalStatus}</p>}
        </div> */}

        {/* ── Contact & Address ── */}
        <FormSeparator title="Contact & Address" />

        <div className="af-field">
          <label className="af-label">
              Email Address
              <span style={{ marginLeft: 8, fontSize: 14, color: '#5a6f8a', fontWeight: 500 }}>
                (from your account)
              </span>
            </label>
            <input
              type="email"
              className="af-input"
              value={data.email}
              readOnly
              style={{ background: '#f4f6f9', cursor: 'not-allowed', color: '#5a6f8a' }}
            />
        </div>

        <div className="af-field">
          <label className="af-label">Phone Number<span className="af-required">*</span></label>
          <input
            className={`af-input ${errors.phone ? 'error' : ''}`}
            value={data.phone}
            onChange={set('phone')}
            placeholder="e.g. 012-3456789"
            inputMode="tel"
          />
          {errors.phone && <p className="af-field-error">{errors.phone}</p>}
        </div>

        <div className="af-field af-col-full">
          <label className="af-label">Full Address<span className="af-required">*</span></label>
          <textarea
            className={`af-textarea ${errors.fullAddress ? 'error' : ''}`}
            value={data.fullAddress}
            onChange={set('fullAddress')}
            placeholder="Full address"
            rows="4"
          />
          {errors.fullAddress && <p className="af-field-error">{errors.fullAddress}</p>}
        </div>

        <div className="af-field">
          <label className="af-label">Postal Code<span className="af-required">*</span></label>
          <input
            className={`af-input ${errors.postalCode ? 'error' : ''}`}
            value={data.postalCode}
            onChange={(e) => onFieldChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 11700"
            inputMode="numeric"
            maxLength={5}
          />
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

      </div>
    </>
  );
}


// ══════════════════════════════════════════════════════════
// STEP 2 – Education
// ══════════════════════════════════════════════════════════
function StepEducation({ education, onEduChange, errors }) {
  const addEdu = () => onEduChange([...education, newEdu()]);
  const delEdu = (id) => onEduChange(education.filter((r) => r._id !== id));
  const setEdu = (id, field, val) => onEduChange(education.map((r) => r._id === id ? { ...r, [field]: val } : r));

  return (
    <>
      <div className="af-section">
        <div className="af-section-header">
          <button className="af-btn-add" onClick={addEdu} type="button">
            <Icon d="M12 5v14M5 12h14" size={13} color="white" />
            Add Education
          </button>
        </div>
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Institute Name</th><th>Qualification</th>
                <th>Start Date</th><th>End Date</th><th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {education.length === 0
                ? <tr><td colSpan={5} className="af-empty">No education records added yet</td></tr>
                : education.map((row) => (
                  <tr key={row._id}>
                    <td><input className="af-table-input" value={row.institute}
                      onChange={(e) => setEdu(row._id, 'institute', e.target.value)}
                      placeholder="e.g. SMK Tasek Gelugor" /></td>
                    <td>
                      <select className="af-table-select" value={row.qualification}
                        onChange={(e) => setEdu(row._id, 'qualification', e.target.value)}>
                        <option value="">Select</option>
                        <option>SPM</option><option>UEC</option>
                        <option>SKM</option><option>Others</option>
                      </select>
                    </td>
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
          {errors.education && <p className="af-field-error">{errors.education}</p>}
        </div>
      </div>
    </>
  );
}


// ══════════════════════════════════════════════════════════
// STEP 3 – Interview Slot
// ══════════════════════════════════════════════════════════
function StepInterviewSlot({ slots, selectedId, onSelect, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <span className="af-spinner" style={{
          width: 28, height: 28,
          borderColor: 'rgba(27,58,107,0.15)',
          borderTopColor: '#1b3a6b',
        }} />
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#5a6f8a' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>📅</div>
        <p style={{ fontWeight: 800, color: '#1b3a6b', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          No Interview Slots Available
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.65, maxWidth: 360, margin: '0 auto' }}>
          There are no available interview slots at the moment. Please check back later or contact the programme administrator.
        </p>
      </div>
    );
  }

  const fmtSlot = (dt) => {
    const d = new Date(dt);
    return {
      day:  d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  return (
    <div>
      <label className="af-label">
        Select your preferred interview slot below.
        <span className="af-required">*</span>
      </label>
      <p style={{ fontSize: 15, color: '#5a6f8a', marginBottom: 20, fontWeight: 500, lineHeight: 1.6 }}>
        Slots marked as <strong style={{ color: '#c0392b' }}>Full</strong> are no longer accepting applicants.
      </p>
      <div className="af-slot-grid">
        {slots.map((slot) => {
          const { day, time } = fmtSlot(slot.datetime);
          const available = slot.capacity - (slot.booked || 0);
          const isFull     = available <= 0;
          const isSelected = slot.id === selectedId;

          return (
            <div
              key={slot.id}
              className={`af-slot-card${isFull ? ' full' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => !isFull && onSelect(slot.id)}
              role="button"
              aria-disabled={isFull}
              tabIndex={isFull ? -1 : 0}
              onKeyDown={(e) => e.key === 'Enter' && !isFull && onSelect(slot.id)}
            >
              {isSelected && !isFull && (
                <span className="af-slot-badge af-slot-badge-selected">
                  <Icon d="M20 6L9 17l-5-5" size={10} color="#1e40af" sw={2.5} />
                  Selected
                </span>
              )}
              {isFull && (
                <span className="af-slot-badge af-slot-badge-full">Full</span>
              )}
              <p className="af-slot-card-date">{day}</p>
              <p className="af-slot-card-time">
                <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3" size={12} color="#5a6f8a" />
                {time}
              </p>
              <p className={`af-slot-card-avail${isFull ? ' af-slot-card-avail-full' : ''}`}>
                {isFull
                  ? 'No spots remaining'
                  : `${available} spot${available !== 1 ? 's' : ''} available`
                }
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function ApplicationForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const accountName = user.name || '';
  const accountEmail = user.email || '';

  const [personal, setPersonal] = useState({
    fullName: accountName, dob: '', gender: '',
    email: accountEmail, phone: '',
    fullAddress: '', postalCode: '', state: '',
    hearAboutUs: '',
  });

  //   const [personal, setPersonal] = useState({
  //   fullName: accountName, icNumber: '', dob: '', gender: '',
  //   race: '', maritalStatus: '', email: accountEmail, phone: '',
  //   fullAddress: '', postalCode: '', state: '',
  //   hearAboutUs: '',
  // });

  const [errors,          setErrors]         = useState({});
  const [step1Alert,      setStep1Alert]     = useState(null);
  const [step2Alert,      setStep2Alert]     = useState(null);
  const [education,       setEducation]      = useState([]);
  const [interviewSlotId, setInterviewSlotId]= useState('');
  const [slots,           setSlots]          = useState([]);
  const [slotsLoading,    setSlotsLoading]   = useState(false);
  const [submitting,      setSubmitting]     = useState(false);
  const [saving,          setSaving]         = useState(false);
  const [submitAlert,     setSubmitAlert]    = useState(null);
  const [submitted,       setSubmitted]      = useState(false);
  const [toast,           setToast]          = useState(null);
  const [loading,         setLoading]        = useState(true);

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
            fullName:      accountName,
            // icNumber:      a.ic_number       || '',
            dob:           a.date_of_birth ? a.date_of_birth.split('T')[0] : '',
            gender:        a.gender          || '',
            // race:          a.race            || '',
            // maritalStatus: a.marital_status  || '',
            email:         accountEmail,
            phone:         a.phone           || '',
            fullAddress:   a.full_address    || '',
            postalCode:    a.postal_code     || '',
            state:         a.state           || '',
            hearAboutUs:   a.hear_about_us   || '',
          });
          if (a.interview_slot_id) setInterviewSlotId(String(a.interview_slot_id));
          if (a.education?.length)
            setEducation(a.education.map((e) => ({
              _id:           uid(),
              institute:     e.institute_name || '',
              qualification: e.qualification  || '',
              startDate:     e.start_date ? e.start_date.split('T')[0] : '',
              endDate:       e.end_date   ? e.end_date.split('T')[0]   : '',
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

  // ── Fetch interview slots on mount ──────────────────────
  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res  = await fetch(`${API}/interview-slots`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        if (res.ok) setSlots(data.slots || []);
      } catch (err) {
        console.error('Failed to fetch interview slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, []);

  // ── Field change handler ─────────────────────────────────
  const handleFieldChange = (field, value) => {
    setPersonal((prev) => ({ ...prev, [field]: value }));
    if (errors[field])  setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    if (step1Alert)     setStep1Alert(null);
  };

  // ── Step 1 and 2 validation ────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};

    const required = {
      // icNumber:      'IC number is required.',
      dob:           'Date of birth is required.',
      gender:        'Please select a gender.',
      // race:          'Please select a race.',
      // maritalStatus: 'Please select marital status.',
      phone:         'Phone number is required.',
      fullAddress:   'Full address is required.',
      postalCode:    'Postal code is required.',
      state:         'Please select a state.',
    };
    Object.entries(required).forEach(([k, msg]) => {
      if (!personal[k]?.trim()) errs[k] = msg;
    });

    if (personal.icNumber && !/^\d{6}-\d{2}-\d{4}$/.test(personal.icNumber))
      errs.icNumber = 'IC number must be in the format XXXXXX-XX-XXXX.';

    if (personal.dob) {
      const d = new Date(personal.dob);
      const now = new Date();
      if (isNaN(d.getTime())) {
        errs.dob = 'Please enter a valid date.';
      } else if (d > now) {
        errs.dob = 'Date of birth cannot be in the future.';
      } else if (now.getFullYear() - d.getFullYear() > 100) {
        errs.dob = 'Please enter a valid year.';
      }
    }

    if (personal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email))
      errs.email = 'Please enter a valid email address.';

    if (personal.phone && !/^(\+?60|0)\d{1,2}[-\s]?\d{7,8}$/.test(personal.phone.trim()))
      errs.phone = 'Enter a valid Malaysian phone number (e.g. 012-3456789).';

    if (personal.postalCode && !/^\d{5}$/.test(personal.postalCode.trim()))
      errs.postalCode = 'Postal code must be exactly 5 digits.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    if (education.length === 0) {
      setStep2Alert({ type: 'error', msg: 'Please add at least one education record.' });
      return false;
    }
    return true;
  };

  // ── Navigation ───────────────────────────────────────────
  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) {
        setStep1Alert({ type: 'error', msg: 'Please fill in all required fields before continuing.' });
        window.scrollTo(0, 0);
        return;
      }
      setStep1Alert(null);
    }

    if (step === 2) {
      if (!validateStep2()) {
        setStep2Alert({ type: 'error', msg: 'Please add at least one education record before continuing.' });
        window.scrollTo(0, 0);
        return;
      }
    }

    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => { setStep((s) => s - 1); window.scrollTo(0, 0); };

  // ── Build form payload ───────────────────────────────────
  const buildPayload = (action) => {
    const formData = new FormData();
    Object.entries(personal).forEach(([k, v]) => formData.append(k, v));
    formData.append('education', JSON.stringify(education.map(({ _id, ...rest }) => rest)));
    if (interviewSlotId) formData.append('interviewSlotId', interviewSlotId);
    formData.append('action', action); // 'draft' | 'submit'
    return formData;
  };

  // ── Save Draft ───────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/application-form`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    buildPayload('draft'),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Could not save draft. Please try again.', 'error');
        return;
      }
      showToast('Draft saved successfully!', 'success');
    } catch {
      showToast('Network error. Could not save draft.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!interviewSlotId) {
      setSubmitAlert({ type: 'error', msg: 'Please select an interview slot before submitting your application.' });
      window.scrollTo(0, 0);
      return;
    }
    if (!personal.hearAboutUs) {
      setSubmitAlert({ type: 'error', msg: 'Please let us know how you heard about us.', field: 'hearAboutUs' });
      window.scrollTo(0, 0);
      return;
    }
    setSubmitting(true);
    setSubmitAlert(null);
    try {
      const res  = await fetch(`${API}/application-form`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body:    buildPayload('submit'),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitAlert({ type: 'error', msg: data.message || 'Submission failed. Please try again.' });
        return;
      }
      showToast('Application submitted successfully!', 'success');
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch {
      setSubmitAlert({ type: 'error', msg: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step Indicator ───────────────────────────────────────
  const StepIndicator = () => (
    <div className="af-steps">
      <div className="af-step">
        <div className={`af-step-dot ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>
          {step > 1 ? <Icon d="M20 6L9 17l-5-5" size={12} color="white" sw={2.5} /> : '1'}
        </div>
        <span className={`af-step-label ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>Personal Information</span>
      </div>
      <div className={`af-step-line ${step > 1 ? 'done' : ''}`} />
      <div className="af-step">
        <div className={`af-step-dot ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>
          {step > 2 ? <Icon d="M20 6L9 17l-5-5" size={12} color="white" sw={2.5} /> : '2'}
        </div>
        <span className={`af-step-label ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>Education</span>
      </div>
      <div className={`af-step-line ${step > 2 ? 'done' : ''}`} />
      <div className="af-step">
        <div className={`af-step-dot ${step === 3 ? 'active' : ''}`}>3</div>
        <span className={`af-step-label ${step === 3 ? 'active' : ''}`}>Interview & Info</span>
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
      <Layout activePage="application">
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        <div className="af-content">
          <div className="af-card">
            <div className="af-success-wrap">
              <p className="af-success-title">Application Submitted!</p>
              <p className="af-success-text">
                Your application has been received. We will be in touch regarding your interview schedule.
              </p>
              <button
                className="af-btn-next"
                style={{ marginTop: '24px' }}
                onClick={() => navigate('/my-application')}
              >
                View My Application
                <Icon d="M5 12h14M12 5l7 7-7 7" size={14} color="white" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Main render ──────────────────────────────────────────
  return (
    <Layout activePage="application">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="af-content">
        <StepIndicator />

        <div className="af-card">
          <div className="af-card-header">
            {step === 1 && (
              <>
                <p className="af-card-title">Personal Information</p>
                <p className="af-card-subtitle">Please provide your personal and contact details</p>
              </>
            )}
            {step === 2 && (
              <>
                <p className="af-card-title">Education</p>
                <p className="af-card-subtitle">Please provide your educational background</p>
              </>
            )}
            {step === 3 && (
              <>
                <p className="af-card-title">Interview & Additional Information</p>
                <p className="af-card-subtitle">Select your preferred interview slot and tell us how you found us</p>
              </>
            )}
          </div>

          <div className="af-card-body">

            {/* ── Step 1 alert banner ── */}
            {step === 1 && step1Alert && (
              <div className={`af-alert ${step1Alert.type}`}>
                <Icon
                  d={step1Alert.type === 'error'
                    ? 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01'
                    : 'M20 6L9 17l-5-5'}
                  size={21}
                />
                {step1Alert.msg}
              </div>
            )}

            {step === 1 && (
              <StepPersonal
                data={personal}
                onChange={setPersonal}
                errors={errors}
                onFieldChange={handleFieldChange}
              />
            )}

            {step === 2 && step2Alert && (
              <div className={`af-alert ${step2Alert.type}`}>
                <Icon
                  d={step2Alert.type === 'error'
                    ? 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01'
                    : 'M20 6L9 17l-5-5'}
                  size={21}
                />
                {step2Alert.msg}
              </div>
            )}

            {step === 2 && (
              <StepEducation
                education={education}
                errors={errors}
                onEduChange={(val) => { setEducation(val); setStep2Alert(null); }}
              />
            )}

            {step === 3 && (
              <>
              <div className="af-form-separator af-col-full" style={{ marginBottom: 20 }}>
                    <span className="af-form-separator-label">Interview Slot</span>
                    <div className="af-form-separator-line" />
                  </div>
                {submitAlert && (
                  <div className={`af-alert ${submitAlert.type}`}>
                    <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={14} />
                    {submitAlert.msg}
                  </div>
                )}
                <StepInterviewSlot
                  slots={slots}
                  selectedId={interviewSlotId}
                  onSelect={setInterviewSlotId}
                  loading={slotsLoading}
                />

                {/* ── Additional Information ── */}
                <div style={{ marginTop: 32, paddingTop: 28, borderTop: '2px solid #edf1f7' }}>
                  <div className="af-form-separator af-col-full" style={{ marginBottom: 20 }}>
                    <span className="af-form-separator-label">Additional Information</span>
                    <div className="af-form-separator-line" />
                  </div>
                  <div className="af-field" style={{ maxWidth: 480 }}>
                    <label className="af-label">
                      How Did You Hear About Us?<span className="af-required">*</span>
                    </label>
                    <select
                      className={`af-select ${submitAlert?.field === 'hearAboutUs' ? 'error' : ''}`}
                      value={personal.hearAboutUs}
                      onChange={(e) => setPersonal((p) => ({ ...p, hearAboutUs: e.target.value }))}
                    >
                      {HEAR_ABOUT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Footer: Back | [spacer] | Save Draft | Next/Submit ── */}
          <div className="af-form-footer">
            {step > 1 && (
              <button className="af-btn-back" onClick={handleBack} disabled={submitting || saving}>
                Back
              </button>
            )}

            <div style={{ flex: 1 }} />

            {/* Save Draft – always visible */}
            <button
              className="af-btn-save"
              onClick={handleSave}
              disabled={submitting || saving}
            >
              {saving
                ? <><span className="af-spinner af-spinner-green" /> Saving…</>
                : <><Icon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" size={14} color="#1a6b3a" /> Save Draft</>
              }
            </button>

            {step < 3 && (
              <button className="af-btn-next" onClick={handleNext} disabled={saving}>
                Next <Icon d="M5 12h14M12 5l7 7-7 7" size={14} color="white" />
              </button>
            )}

            {step === 3 && (
              <button className="af-btn-next" onClick={handleSubmit} disabled={submitting || saving}>
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