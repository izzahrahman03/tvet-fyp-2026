// api/internshipApi.js
// Student-facing internship API calls.

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem('token');

async function apiFetch(path, opts = {}) {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };

  // Only set Content-Type to JSON if we're NOT sending FormData
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res  = await fetch(`${API}${path}`, {
    ...opts,
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/** GET /student/internship-vacancies?search= */
export const fetchOpenVacancies = (search = '') =>
  apiFetch(`/student/internship-vacancies${search ? `?search=${encodeURIComponent(search)}` : ''}`)
    .then((d) => d.vacancies || []);

/**
 * POST /student/internship-apply
 * Sends multipart/form-data — do NOT set Content-Type manually (browser sets boundary).
 * @param {number} vacancyId
 * @param {File}   resumeFile
 * @param {File|null} coverLetterFile
 */
// ✅ Correct — don't pass headers at all, let apiFetch handle Authorization
export const applyToVacancy = (vacancyId, resumeFile, coverLetterFile) => {
  const fd = new FormData();
  fd.append('vacancy_id',   vacancyId);
  fd.append('resume',       resumeFile);
  if (coverLetterFile) fd.append('cover_letter', coverLetterFile);

  return apiFetch('/student/internship-apply', {
    method: 'POST',
    body:   fd,
  });
};

/** GET /student/my-internship-applications */
export const fetchMyApplications = () =>
  apiFetch('/student/my-internship-applications').then((d) => d.applications || []);

export const acceptInternshipOffer    = (id) => apiFetch(`/student/internship-accept/${id}`,   { method: 'POST' });
export const declineInternshipOffer   = (id) => apiFetch(`/student/internship-decline/${id}`,  { method: 'POST' });
export const requestInternshipWithdraw = (id) => apiFetch(`/student/internship-withdraw/${id}`, { method: 'POST' });