import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SupervisorLayout from "../../components/dashboard/Layout";

const API      = process.env.REACT_APP_API_URL;
const getToken = () => localStorage.getItem("token");


// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function SupervisorDashboard() {
  // const navigate   = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Guest";

    return (
        <SupervisorLayout title="Dashboard">
    
          {/* ── Welcome banner ── */}
          <div style={{
            background: "#1b3a6b",
            borderRadius: "5px", padding: "28px 32px", marginBottom: "28px",
          }}>
            <h1 style={{ color: "white", fontSize: "22px", fontWeight: "700", margin: 0 }}>
              Welcome back, {userName}
            </h1>
          </div>
    
        </SupervisorLayout>
    );
}