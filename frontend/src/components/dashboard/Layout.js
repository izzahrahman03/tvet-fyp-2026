import { useState } from "react";
import ApplicantSidebar from "./ApplicantSidebar";
import AdminSidebar from "./AdminSidebar";
import StudentSidebar from "./StudentSidebar";
import PartnerSidebar from "./PartnerSidebar";
import SupervisorSidebar from "./SupervisorSidebar";
import Topbar  from "./Topbar";
import "../../css/dashboard/applicantDashboard.css"; // ← your existing CSS file

// ══════════════════════════════════════════════════════════
// ApplicantLayout
// Props:
//   children  — ReactNode  (page content)
//   title     — string    (optional page title for mobile topbar)
// ══════════════════════════════════════════════════════════
export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role;

  // Decide which sidebar to render
  const renderSidebar = () => {
    switch (role) {
      case "applicant":
      default:
        return (
          <ApplicantSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );
    
        case "admin":
        return (
          <AdminSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );
    
      case "student":
        return (
          <StudentSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );

        case "industry_partner":
        return (
          <PartnerSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );

      case "industry_supervisor":
        return (
          <SupervisorSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );
}
  };

  return (
    <div className="db-layout">

      {renderSidebar()}

      <main className="db-main">

        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {children}

      </main>

    </div>
  );
}