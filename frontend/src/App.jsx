import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import "./css/global.css";

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';

import ApplicantDashboard from './pages/dashboard/ApplicantDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import PartnerDashboard from './pages/dashboard/PartnerDashboard';

import UserTable from './pages/userManagement/UserTable';
import DashboardLayout from './components/dashboard/Layout'; // ✅ renamed import

import ActivationPage from './pages/userManagement/ActivationPage';
import SetPasswordPage from './pages/userManagement/SetPasswordPage';
import ForgotPassword from './pages/userManagement/ForgotPassword';
import ResetPassword from './pages/userManagement/ResetPassword';
import UpdateProfile from './pages/userManagement/UpdateProfile';

import ApplicationForm from './pages/applicationManagement/ApplicationForm';
import MyApplication from './pages/applicationManagement/MyApplication';

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
        <Route path="/profile"  element={<UpdateProfile />} />

        {/* ── Applicant dashboard ─────────────────────── */}
        <Route path="/applicant-dashboard" element={<ApplicantDashboard />} />
        <Route path="/application-form"    element={<ApplicationForm />} />
        <Route path="/my-application"      element={<MyApplication />} />

        {/* ── Admin dashboard ─────────────────────────── */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* ✅ Use DashboardLayout — NOT the public Layout  */}
        <Route path="/admin/users/applicants" element={
          <DashboardLayout title="Applicants">
            <UserTable type="applicant" />
          </DashboardLayout>
        } />
        <Route path="/admin/users/students" element={
          <DashboardLayout title="Students">
            <UserTable type="student" />
          </DashboardLayout>
        } />
        <Route path="/admin/users/industry-partners" element={
          <DashboardLayout title="Industry Partners">
            <UserTable type="industry_partner" />
          </DashboardLayout>
        } />
        <Route path="/admin/users/industry-supervisors" element={
          <DashboardLayout title="Industry Supervisors">
            <UserTable type="industry_supervisor" />
          </DashboardLayout>
        } />
        <Route path="/admin/applications" element={
          <DashboardLayout title="Applications">
            <UserTable type="application" />
          </DashboardLayout>
        } />

        {/* ── Industry Partner dashboard ─────────────────────── */}
        <Route path="/industry-partner-dashboard" element={<PartnerDashboard />} />
        <Route path="/application-form"    element={<ApplicationForm />} />
        <Route path="/my-application"      element={<MyApplication />} />

      </Routes>
    </Router>
  );
}

export default App;