// api/adminApi.js
// All functions now hit real backend endpoints — no more mockDB or delay()

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
// USERS
// ══════════════════════════════════════════════════════════

/**
 * Fetch all users of a given role
 * GET /api/admin/users?role=applicant
 */
export const fetchUsers = async (type) => {
  const data = await apiFetch(`/admin/users?role=${type}`);
  return data.users || [];
};

/**
 * Add a new user — triggers activation email on backend
 * POST /api/auth/create-user
 */
export const addUser = async (type, userData) => {
  const data = await apiFetch("/auth/create-user", {
    method: "POST",
    body:   JSON.stringify({ ...userData, userType: type }),
  });
  return data.user;
};

/**
 * Update a user's profile info
 * PUT /api/admin/users/:id
 */
export const updateUser = async (type, id, updates) => {
  const data = await apiFetch(`/admin/users/${id}`, {
    method: "PUT",
    body:   JSON.stringify(updates),
  });
  return data.user;
};

/**
 * Delete a user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (type, id) => {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" });
};

/**
 * Bulk import users from Excel/CSV
 * POST /api/admin/users/import
 */
export const importUsers = async (type, users) => {
  const data = await apiFetch("/admin/users/import", {
    method: "POST",
    body:   JSON.stringify({ role: type, users }),
  });
  return data.imported || [];
};

/**
 * Resend activation email
 * POST /api/admin/users/:id/resend-activation
 */
export const resendActivation = async (userId) => {
  return apiFetch(`/admin/users/${userId}/resend-activation`, {
    method: "POST",
  });
};

// ══════════════════════════════════════════════════════════
// STATS (for Overview charts)
// GET /api/admin/stats
// ══════════════════════════════════════════════════════════
export const fetchStats = async () => {
  const data = await apiFetch("/admin/stats");
  return data;
};