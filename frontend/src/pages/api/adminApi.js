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

export const fetchUsers = async (type) => {
  const data = await apiFetch(`/admin/users?role=${type}`);
  return data.users || []; // FIX: was returning { status: "inactive" } object instead of []
};

export const addUser = async (type, userData) => {
  const data = await apiFetch(`/admin/users?role=${type}`, { // FIX: was a plain string, not a template literal
    method: "POST",
    body:   JSON.stringify({ ...userData, role: type }),
  });
  return data.user;
};

export const updateUser = async (type, id, updates) => {
  const data = await apiFetch(`/admin/users/${id}?role=${type}`, { // FIX: pass role so backend knows which table to update
    method: "PUT",
    body:   JSON.stringify(updates),
  });
  return data.user;
};

export const deleteUser = async (type, id) => {
  return apiFetch(`/admin/users/${id}?role=${type}`, { method: "DELETE" }); // FIX: pass role so backend knows which table to delete from
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

export const fetchStats = async () => {
  const data = await apiFetch("/admin/stats");
  return data;
};