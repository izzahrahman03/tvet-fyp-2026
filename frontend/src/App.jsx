import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import "./css/global.css";

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';

import ApplicantDashboard from './pages/dashboard/ApplicantDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import PartnerDashboard from './pages/dashboard/PartnerDashboard';
import SupervisorDashboard from './pages/dashboard/SupervisorDashboard';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';

import UserTable from './pages/userManagement/UserTable';
import DashboardLayout from './components/dashboard/Layout'; // ✅ renamed import
import IntakePage from './pages/userManagement/IntakePage';
import InterviewSlot from './pages/userManagement/InterviewSlot';

import ActivationPage from './pages/userManagement/ActivationPage';
import SetPasswordPage from './pages/userManagement/SetPasswordPage';
import ForgotPassword from './pages/userManagement/ForgotPassword';
import ResetPassword from './pages/userManagement/ResetPassword';
import UpdateProfile from './pages/userManagement/UpdateProfile';

import ApplicationForm from './pages/applicationManagement/ApplicationForm';
import MyApplication from './pages/applicationManagement/MyApplication';

import Vacancies from './pages/internshipManagement/Vacancies';
import InternshipVacanciesList from './pages/internshipManagement/InternshipVacanciesList';
import MyInternshipApplications from './pages/internshipManagement/MyInternshipApplications';
import InternshipApplicationTable from './pages/internshipManagement/InternshipApplicationsTable'; 

const Forbidden = () => (
  <div style={{ textAlign: 'center', marginTop: '10vh' }}>
    <h1>403 – Forbidden</h1>
    <p>You don't have permission to view this page.</p>
    <button onClick={() => window.history.back()}>Go Back</button>
  </div>
);

const PAGE_TITLES = {
  "/":                                  "Home",
  "/signup":                            "Sign Up",
  "/login":                             "Login",
  "/activate":                          "Activate Account",
  "/set-password":                      "Set Password",
  "/forgot-password":                   "Forgot Password",
  "/reset-password":                    "Reset Password",
  "/profile":                           "Update Profile",

  "/applicant-dashboard":               "Applicant Dashboard",
  "/application-form":                  "Application Form",
  "/my-application":                    "My Application",

  "/admin-dashboard":                   "Admin Dashboard",
  "/admin/users/applicants":            "Applicants",
  "/admin/users/students":              "Students",
  "/admin/users/industry-partners":     "Industry Partners",
  "/admin/users/industry-supervisors":  "Industry Supervisors",
  "/admin/users/managers":              "Managers",
  "/admin/users/applications":          "Applications",
  "/applications":                "Applications",
  "/intakes":                     "Intakes",
  "/interview-slots":             "Interview Slots",

  "/student-dashboard":                 "Student Dashboard",
  "/student/internship-vacancies":      "Internship Vacancies",
  "/student/my-internship-applications":"My Internship Applications",

  "/partner-dashboard":                 "Partner Dashboard",
  "/partner/internship-vacancies":      "Internship Vacancies",
  "/partner/internship-applications":   "Internship Applications",

  "/supervisor-dashboard":              "Supervisor Dashboard",

  "/manager-dashboard":                 "Manager Dashboard",
};

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname];
    document.title = pageTitle
      ? `${pageTitle} | Vitrox Academy`
      : "Vitrox Academy";
  }, [location.pathname]);

  return null;
}

// ── Public layout (Home, Login, Signup) ───────────────────
const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

function App() {
  return (
    <Router>
      <TitleUpdater />
      <Routes>

        {/* ── Public pages (with Navbar) ──────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"       element={<Home />} />
        </Route>

        {/* ── Auth pages (no Navbar) ──────────────────── */}

        <Route path="/signup" element={<Signup />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/activate"        element={<ActivationPage />} />
        <Route path="/set-password"    element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/403"    element={<Forbidden />} />

        {/* ── Profile (any logged-in user) ── */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['admin','applicant','student','industry_partner','industry_supervisor','manager']}>
            <UpdateProfile />
          </ProtectedRoute>
        } />

        {/* ── Applicant ── */}
        <Route path="/applicant-dashboard" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ApplicantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/application-form" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ApplicationForm />
          </ProtectedRoute>
        } />
        <Route path="/my-application" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <MyApplication />
          </ProtectedRoute>
        } />

        {/* ── Admin ── */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users/applicants" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Applicants"><UserTable type="applicant" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users/students" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Students"><UserTable type="student" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users/industry-partners" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Industry Partners"><UserTable type="industry_partner" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users/industry-supervisors" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Industry Supervisors"><UserTable type="industry_supervisor" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users/managers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Managers"><UserTable type="manager" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <DashboardLayout title="Applications"><UserTable type="application" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/intakes" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <DashboardLayout title="Intakes"><IntakePage type="intake" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/interview-slots" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <DashboardLayout title="Interview Slots"><InterviewSlot /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* ── Student ── */}
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/internship-vacancies" element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout title="Internship Vacancies"><InternshipVacanciesList /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/my-internship-applications" element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout title="My Internship Applications"><MyInternshipApplications /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* ── Industry Partner ── */}
        <Route path="/partner-dashboard" element={
          <ProtectedRoute allowedRoles={['industry_partner']}>
            <PartnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/partner/internship-vacancies" element={
          <ProtectedRoute allowedRoles={['industry_partner']}>
            <DashboardLayout title="Internship Vacancies"><Vacancies /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/partner/internship-applications" element={
          <ProtectedRoute allowedRoles={['industry_partner']}>
            <DashboardLayout title="Internship Applications"><InternshipApplicationTable /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* ── Supervisor ── */}
        <Route path="/supervisor-dashboard" element={
          <ProtectedRoute allowedRoles={['industry_supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } />

        {/* ── Manager ── */}
        <Route path="/manager-dashboard" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />

      </Routes>
    </Router>
  );
}

export default App;