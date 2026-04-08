// api/vacancyApi.js
// Used by the industry_partner dashboard.
// Routes are under /partner/vacancies — auth token identifies whose vacancies to use.

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

/** GET /partner/internship-vacancies — list this partner's own vacancies */
export const fetchVacancies = () =>
  apiFetch('/partner/internship-vacancies').then((d) => d.vacancies || []);

/** GET /partner/internship-vacancies/:id — single vacancy */
export const fetchVacancyById = (id) =>
  apiFetch(`/partner/internship-vacancies/${id}`).then((d) => d.vacancy);

/**
 * POST /partner/internship-vacancies
 * partner_id is NOT sent — the backend reads it from the JWT.
 */
export const createVacancy = (payload) =>
  apiFetch('/partner/internship-vacancies', {
    method: 'POST',
    body:   JSON.stringify(payload),
  }).then((d) => d.vacancy);

/** PUT /partner/internship-vacancies/:id */
export const updateVacancy = (id, payload) =>
  apiFetch(`/partner/internship-vacancies/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(payload),
  }).then((d) => d.vacancy);

/** DELETE /partner/internship-vacancies/:id */
export const deleteVacancy = (id) =>
  apiFetch(`/partner/internship-vacancies/${id}`, { method: 'DELETE' });