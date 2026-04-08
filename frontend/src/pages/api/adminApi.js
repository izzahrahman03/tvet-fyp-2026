const API = process.env.REACT_APP_API_URL;

// ─── Auth header helper ───────────────────────────────────
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── Base fetch wrapper ───────────────────────────────────
async function apiFetch(path, options = {}) {
  const res  = await fetch(`${API}${path}`, {
    headers: authHeaders(),
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
}

// ══════════════════════════════════════════════════════════
// USERS  (applicant | student | industry_partner | industry_supervisor)
// ══════════════════════════════════════════════════════════

export const fetchUsers = async (type) => {
  const data = await apiFetch(`/admin/users?role=${type}`);
  return data.users || [];
};

export const addUser = async (type, userData) => {
  const data = await apiFetch(`/admin/users?role=${type}`, {
    method: "POST",
    body:   JSON.stringify({ ...userData, role: type }),
  });
  return data.user;
};

export const updateUser = async (type, id, updates) => {
  const data = await apiFetch(`/admin/users/${id}?role=${type}`, {
    method: "PUT",
    body:   JSON.stringify(updates),
  });
  return data.user;
};

export const deleteUser = async (type, id) => {
  return apiFetch(`/admin/users/${id}?role=${type}`, { method: "DELETE" });
};

export const importUsers = async (type, users) => {
  const data = await apiFetch("/admin/users/import", {
    method: "POST",
    body:   JSON.stringify({ role: type, users }),
  });
  return data.imported || [];
};

export const resendActivation = async (userId) => {
  return apiFetch(`/admin/users/${userId}/resend-activation`, {
    method: "POST",
  });
};

// ══════════════════════════════════════════════════════════
// MISC
// ══════════════════════════════════════════════════════════

export const fetchStats = async () => {
  const data = await apiFetch("/admin/stats");
  return data;
};

export const fetchPartners = async (search = "") => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const data  = await apiFetch(`/admin/partners${query}`);
  return data.partners || [];
};

export const fetchApplicationById = async (id) => {
  const data = await apiFetch(`/applications/${id}`);
  return data.application;  // GET /admin/applications/:id
};

