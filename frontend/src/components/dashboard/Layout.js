import { useState } from "react";
import ApplicantSidebar from "./ApplicantSidebar";
import AdminSidebar from "./AdminSidebar";
import StudentSidebar from "./StudentSidebar";
import PartnerSidebar from "./PartnerSidebar";
import SupervisorSidebar from "./SupervisorSidebar";
import ManagerSidebar from "./ManagerSidebar";
import Topbar  from "./Topbar";
import "../../css/dashboard/applicantDashboard.css"; // ← your existing CSS file

// ══════════════════════════════════════════════════════════
// ApplicantLayout
// Props:
//   children  — ReactNode  (page content)
//   title     — string    (optional page title for mobile topbar)
// ══════════════════════════════════════════════════════════
export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role;

  // Decide which sidebar to render
 const renderSidebar = () => {
  const props = {
    isOpen: sidebarOpen,
    onClose: () => setSidebarOpen(false),
    onToggle: () => setSidebarOpen(prev => !prev),
  };

  switch (role) {
    case "admin":    return <AdminSidebar    {...props} />;
    case "student":  return <StudentSidebar  {...props} />;
    case "industry_partner":    return <PartnerSidebar    {...props} />;
    case "industry_supervisor": return <SupervisorSidebar {...props} />;
    case "manager":  return <ManagerSidebar  {...props} />;
    default:         return <ApplicantSidebar {...props} />;
  }
};

  return (
    <div className="db-layout">
      {renderSidebar()}

       <main className={`db-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        {children}
      </main>
    </div>
  );
}