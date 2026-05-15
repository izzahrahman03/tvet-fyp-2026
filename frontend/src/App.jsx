import React, { useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
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
import InterviewerDashboard from './pages/dashboard/InterviewerDashboard';

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
import InterviewerApplications from './pages/applicationManagement/InterviewerApplications';

import Vacancies from './pages/internshipManagement/Vacancies';
import InternshipVacanciesList from './pages/internshipManagement/InternshipVacanciesList';
import MyInternshipApplications from './pages/internshipManagement/MyInternshipApplications';
import InternshipApplicationTable from './pages/internshipManagement/InternshipApplicationsTable'; 
import InternListTable from './pages/internshipManagement/InternListTable';
import InternshipEvaluation from './pages/internshipManagement/InternshipEvaluation';
import MyEvaluation from './pages/internshipManagement/MyEvaluation';
import AdminInternshipPlacement from './pages/internshipManagement/AdminInternshipPlacement';
import AdminInternshipEvaluationPage from './pages/internshipManagement/AdminInternshipEvaluation';
import TerminationForm from './pages/internshipManagement/TerminationForm';
import AdminTerminationForm from './pages/internshipManagement/AdminTerminationForm';

import StudentAttendance from './pages/TimeManagement/StudentAttendance';
import StudentLeaveRequest from './pages/TimeManagement/StudentLeaveRequest';
import StudentOvertimeRequest from './pages/TimeManagement/StudentOvertimeRequest'; 

import SupervisorAttendanceVerification from './pages/TimeManagement/SupervisorAttendance';
import SupervisorLeaveRequests from './pages/TimeManagement/SupervisorLeaveRequest';
import SupervisorOvertimeRequests from './pages/TimeManagement/SupervisorOvertimeRequest';
import AdminAttendanceRecords from './pages/TimeManagement/AdminAttendanceRecords';
import AdminLeaveRequests from './pages/TimeManagement/AdminLeaveRequestRecords';
import AdminOvertimeRequests from './pages/TimeManagement/AdminOvertimeRequestRecords';

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

  "/interviewer/applications":          "Interviewer Applications",

  "/admin-dashboard":                   "Admin Dashboard",
  "/admin/users/applicants":            "Applicants",
  "/admin/users/students":              "Students",
  "/admin/users/industry-partners":     "Industry Partners",
  "/admin/users/industry-supervisors":  "Industry Supervisors",
  "/admin/users/managers":              "Managers",
  "/admin/users/interviewers":          "Interviewers",
  "/admin/users/applications":          "Applications",
  "/applications":                "Applications",
  "/intakes":                     "Intakes",
  "/interview-slots":             "Interview Slots",
  "/admin/internship/placements":     "Internship Placements",
  "/admin/internship/evaluations":    "Internship Evaluations",
  "/admin/internship/termination-requests":     "Internship Terminations",

  "/student-dashboard":                 "Student Dashboard",
  "/student/internship-vacancies":      "Internship Vacancies",
  "/student/my-internship-applications":"My Internship Applications",
  "/student/my-evaluation":             "My Evaluation",
  
  "/partner-dashboard":                 "Partner Dashboard",
  "/partner/internship-vacancies":      "Internship Vacancies",
  "/partner/internship-applications":   "Internship Applications",
  "/partner/interns":                   "List ofInterns",

  "/supervisor-dashboard":              "Supervisor Dashboard",
  "/internship-evaluations":            "Internship Evaluations",
  "/termination-form":                  "Termination Form",

  "/manager-dashboard":                 "Manager Dashboard",

  "/interviewer-dashboard":              "Interviewer Dashboard",

  "/student/attendance":                "Attendance",
  "/student/leave-requests":             "Leave Request",
  "/student/overtime-requests":          "Overtime Request",

  "/supervisor/attendance":             "Attendance Verification",
  "/supervisor/leave-requests":         "Leave Requests",
  "/supervisor/overtime-requests":      "Overtime Requests",
  "/supervisor/termination-form":       "Termination Form",

  "/admin/attendance":                 "Attendance Records",
  "/admin/leave-requests":              "Leave Requests",
  "/admin/overtime-requests":           "Overtime Requests",

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
    <Outlet />
  </>
);

function App() {
  return (
    <>
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
          <ProtectedRoute allowedRoles={['admin','applicant','student','industry_partner','industry_supervisor','manager','interviewer']}>
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
        <Route path="/admin/users/interviewers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Interviewers"><UserTable type="interviewer" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <DashboardLayout title="Applications"><UserTable type="application" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/intakes" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'industry_partner']}>
            <DashboardLayout title="Intakes"><IntakePage type="intake" /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/interview-slots" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <DashboardLayout title="Interview Slots"><InterviewSlot /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/internship/placements" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Internship Placements"><AdminInternshipPlacement /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/internship/evaluations" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Internship Evaluations"><AdminInternshipEvaluationPage /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/internship/termination-requests" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Internship Terminations Requests"><AdminTerminationForm /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/attendance" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Attendance Records"><AdminAttendanceRecords /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/leave-requests" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Leave Requests"><AdminLeaveRequests /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/overtime-requests" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout title="Overtime Requests"><AdminOvertimeRequests /></DashboardLayout>
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
        <Route path="/student/my-evaluation" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyEvaluation />
          </ProtectedRoute>
        } />
        <Route path="/student/attendance" element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout title="Attendance"><StudentAttendance /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/leave-requests" element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout title="Leave Requests"><StudentLeaveRequest /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/overtime-requests" element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout title="Overtime Requests"><StudentOvertimeRequest /></DashboardLayout>
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
        <Route path="/partner/interns" element={
          <ProtectedRoute allowedRoles={['industry_partner']}>
            <DashboardLayout title="List of Interns"><InternListTable /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* ── Supervisor ── */}
        <Route path="/supervisor-dashboard" element={
          <ProtectedRoute allowedRoles={['industry_supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/supervisor/internship-evaluations" element={
          <ProtectedRoute allowedRoles={['industry_supervisor']}>
            <DashboardLayout title="Internship Evaluations"><InternshipEvaluation /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/termination-form" element={
          <ProtectedRoute allowedRoles={['industry_supervisor']}>
            <DashboardLayout title="Internship Terminations"><TerminationForm /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/attendance" element={
          <ProtectedRoute allowedRoles={['industry_supervisor']}>
            <DashboardLayout title="Attendance Verification"><SupervisorAttendanceVerification /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/leave-requests" element={
          <ProtectedRoute allowedRoles={['industry_supervisor']}>
            <DashboardLayout title="Leave Requests"><SupervisorLeaveRequests /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/overtime-requests" element={
          <ProtectedRoute allowedRoles={['industry_supervisor']}>
            <DashboardLayout title="Overtime Requests"><SupervisorOvertimeRequests /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* ── Manager ── */}
        <Route path="/manager-dashboard" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />

        {/* ── Interviewer ── */}
        <Route path="/interviewer-dashboard" element={
          <ProtectedRoute allowedRoles={['interviewer']}>
            <InterviewerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/interviewer/applications" element={
          <ProtectedRoute allowedRoles={['interviewer']}>
            <DashboardLayout title="My Applications"><InterviewerApplications /></DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;