// api/partnerInternshipApi.js

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem('token');

async function apiFetch(path, opts = {}) {
  const res  = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${getToken()}`,
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/** GET /partner/internship-applications */
export const fetchInternshipApplications = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'All'))
  ).toString();
  return apiFetch(`/partner/internship-applications${qs ? `?${qs}` : ''}`)
    .then((d) => d.applications || []);
};

/** PUT /partner/internship-applications/:id/status */
export const updateInternshipStatus = (id, status, details = {}) =>
  apiFetch(`/partner/internship-applications/${id}/status`, {
    method: 'PUT',
    body:   JSON.stringify({ status, ...details }),
  });

/** Download document — opens in new tab */
export const getDocumentDownloadUrl = (id, type) =>
  `${API}/partner/internship-applications/${id}/download/${type}?token=${getToken()}`;

export const approveWithdrawRequest = (id) =>
  apiFetch(`/partner/internship-applications/${id}/approve-withdraw`, { method: 'PUT' });