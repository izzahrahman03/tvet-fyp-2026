// api/interviewerApi.js
import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Fetch all applications assigned to the logged-in interviewer
export const fetchMyApplications = async () => {
  const { data } = await axios.get(
    `${BASE}/interviewer/applications`,
    authHeader()
  );
  return data.applications ?? [];
};

// Fetch an existing evaluation for an application
export const fetchEvaluation = async (applicationId) => {
  const { data } = await axios.get(
    `${BASE}/interviewer/applications/${applicationId}/evaluation`,
    authHeader()
  );
  return data.evaluation;
};

// Submit (create or update) an evaluation
export const submitEvaluation = async (applicationId, payload) => {
  const { data } = await axios.post(
    `${BASE}/interviewer/applications/${applicationId}/evaluate`,
    payload,
    authHeader()
  );
  return data;
};