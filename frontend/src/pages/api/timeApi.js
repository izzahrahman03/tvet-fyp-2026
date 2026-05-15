import axios from "axios";

const BASE    = process.env.REACT_APP_API_URL || "http://localhost:5000";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// ── Leave ─────────────────────────────────────────────────
export const submitLeaveRequest = (formData) =>
  axios.post(`${BASE}/student/leave-requests`, formData, {
    headers: { ...headers(), "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const fetchMyLeaveRequests = () =>
  axios.get(`${BASE}/student/leave-requests`, { headers: headers() })
    .then((r) => r.data.leave_requests ?? []);

export const fetchSupervisorLeaveRequests = () =>
  axios.get(`${BASE}/supervisor/leave-requests`, { headers: headers() })
    .then((r) => r.data.leave_requests ?? []);

export const processLeaveRequest = (id, status, remarks) =>
  axios.put(`${BASE}/supervisor/leave-requests/${id}`,
    { status, supervisor_remarks: remarks },
    { headers: headers() }
  ).then((r) => r.data);

// ── Overtime ──────────────────────────────────────────────
export const submitOvertimeRequest = (payload) =>
  axios.post(`${BASE}/student/overtime-requests`, payload, { headers: headers() })
    .then((r) => r.data);

export const fetchMyOvertimeRequests = () =>
  axios.get(`${BASE}/student/overtime-requests`, { headers: headers() })
    .then((r) => r.data.overtime_requests ?? []);

export const fetchSupervisorOvertimeRequests = () =>
  axios.get(`${BASE}/supervisor/overtime-requests`, { headers: headers() })
    .then((r) => r.data.overtime_requests ?? []);

export const processOvertimeRequest = (id, status, remarks) =>
  axios.put(`${BASE}/supervisor/overtime-requests/${id}`,
    { status, supervisor_remarks: remarks },
    { headers: headers() }
  ).then((r) => r.data);

// ── Attendance ────────────────────────────────────────────
export const recordAttendance = (payload) =>
  axios.post(`${BASE}/student/attendance`, payload, { headers: headers() })
    .then((r) => r.data);

export const fetchMyAttendance = () =>
  axios.get(`${BASE}/student/attendance`, { headers: headers() })
    .then((r) => r.data.attendance ?? []);

export const fetchSupervisorAttendance = () =>
  axios.get(`${BASE}/supervisor/attendance`, { headers: headers() })
    .then((r) => r.data.attendance ?? []);

export const verifyAttendance = (id, status) =>
  axios.put(`${BASE}/supervisor/attendance/${id}`,
    { status },
    { headers: headers() }
  ).then((r) => r.data);

export const clockOutAttendance = (id, data) =>
  axios.patch(`${BASE}/student/attendance/${id}/clock-out`, data, { headers: headers() }).then((r) => r.data);

// GET /api/admin/attendance  →  returns flat array of records
export const adminFetchAllAttendance = () =>
  axios.get(`${BASE}/admin/attendance`, { headers: headers() })
    .then((r) => r.data.attendance ?? [])

// GET /api/admin/leave-requests  →  returns flat array of requests
export const adminFetchAllLeaveRequests = () =>
  axios.get(`${BASE}/admin/leave-requests`, { headers: headers() })
    .then((r) => r.data.leave_requests ?? []);

// GET /api/admin/overtime-requests  →  returns flat array of requests
export const adminFetchAllOvertimeRequests = () =>
  axios.get(`${BASE}/admin/overtime-requests`, { headers: headers() })
    .then((r) => r.data.overtime_requests ?? []);

export const fetchMyInternshipStatus = () =>
  axios.get(`${BASE}/student/my-internship-applications`, { headers: headers() })
    .then((r) => {
      const list = Array.isArray(r.data) ? r.data : (r.data.applications ?? []);
      return list.find(a =>
        a.internship_applicant_response === "accepted" &&
        a.application_status === "passed"
      ) ?? null;
    });

export const fetchStudentProfileInfo = () =>
  axios.get(`${BASE}/profile`, { headers: headers() })
    .then(r => r.data);