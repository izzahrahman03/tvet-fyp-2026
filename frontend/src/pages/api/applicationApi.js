const API = process.env.REACT_APP_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

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
// APPLICATIONS
// ══════════════════════════════════════════════════════════

export const fetchApplications = async (search = "", status = "") => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const query = params.toString() ? `?${params}` : "";
  const data  = await apiFetch(`/applications${query}`);
  return data.applications || [];
};

export const fetchApplicationById = async (id) => {
  const data = await apiFetch(`/applications/${id}`);
  return data.application;
};

export const updateApplicationStatus = async (id, payload) => {
  const data = await apiFetch(`/applications/${id}/status`, {
    method: "PUT",
    body:   JSON.stringify(payload),  // ✅ was incorrectly passing `data` instead of `payload`
  });
  return data;
};

export const deleteApplication = async (id) => {
  return apiFetch(`/applications/${id}`, { method: "DELETE" });
};

// ══════════════════════════════════════════════════════════
// INTERVIEW SLOTS
// ══════════════════════════════════════════════════════════

export const fetchInterviewSlots = async () => {
  const data = await apiFetch("/interview-slots");
  return data.slots || [];
};

export const createInterviewSlot = async (payload) => {
  const data = await apiFetch("/interview-slots", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  return data.slot;
};

export const deleteInterviewSlot = async (id) => {
  return apiFetch(`/interview-slots/${id}`, { method: "DELETE" });
};

// ══════════════════════════════════════════════════════════
// INTAKES
// ══════════════════════════════════════════════════════════

export const fetchIntakes = async () => {
  const data = await apiFetch("/intakes");
  return data.intakes || [];
};

export const createIntake = async (payload) => {
  const data = await apiFetch("/intakes", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  return data.intake;
};

export const updateIntake = async (id, payload) => {
  const data = await apiFetch(`/intakes/${id}`, {
    method: "PUT",
    body:   JSON.stringify(payload),
  });
  return data.intake;
};

export const deleteIntake = async (id) => {
  return apiFetch(`/intakes/${id}`, { method: "DELETE" });
};