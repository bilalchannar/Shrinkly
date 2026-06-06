import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import "../Css/Variables.css";
import ProtectedRoute from "../Components/ProtectedRoute.jsx";

const Auth = React.lazy(() => import("../Auth/Auth.jsx"));
const VerifyEmail = React.lazy(() => import("../Auth/VerifyEmail.jsx"));
const ForgotPassword = React.lazy(() => import("../Auth/ForgotPassword.jsx"));
const ResetPassword = React.lazy(() => import("../Auth/ResetPassword.jsx"));
const OAuthSuccess = React.lazy(() => import("../Pages/OAuthSuccess.jsx"));
const Home = React.lazy(() => import("../Pages/Home.jsx"));
const Landing = React.lazy(() => import("../Pages/Landing.jsx"));
const Link = React.lazy(() => import("../Pages/Link.jsx"));
const Analytics = React.lazy(() => import("../Pages/Analytics.jsx"));
const Reports = React.lazy(() => import("../Pages/Reports.jsx"));
const Contact = React.lazy(() => import("../Pages/Contact.jsx"));
const Profile = React.lazy(() => import("../Pages/Profile.jsx"));
const QrCode = React.lazy(() => import("../Pages/QrCode.jsx"));
const Workspace = React.lazy(() => import("../Pages/Workspace.jsx"));
const Admin = React.lazy(() => import("../Pages/Admin.jsx"));
const AdminRoute = React.lazy(() => import("../Components/AdminRoute.jsx"));
const LinkPassword = React.lazy(() => import("../Pages/LinkPassword.jsx"));
const CustomDomains = React.lazy(() => import("../Pages/CustomDomains.jsx"));
const ApiAccess = React.lazy(() => import("../Pages/ApiAccess.jsx"));
const ReportAbuse = React.lazy(() => import("../Pages/ReportAbuse.jsx"));
const WarningPage = React.lazy(() => import("../Pages/WarningPage.jsx"));
const NotFound = React.lazy(() => import("../Pages/NotFound.jsx"));
const Notifications = React.lazy(() => import("../Pages/Notifications.jsx"));
const ExpiredPage = React.lazy(() => import("../Pages/ExpiredPage.jsx"));
const LimitReachedPage = React.lazy(() => import("../Pages/LimitReachedPage.jsx"));
const DisabledPage = React.lazy(() => import("../Pages/DisabledPage.jsx"));
const ProjectInfo = React.lazy(() => import("../Pages/ProjectInfo.jsx"));

const AppRoutes = () => {
  return (
    <ThemeProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AuthProvider>
        <BrowserRouter>
        <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="loading-spinner"></div></div>}>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/report-abuse" element={<ReportAbuse />} />
          <Route path="/warning" element={<WarningPage />} />

          {/* Protected routes */}
          <Route path="/home" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
          <Route path="/link" element={
            <ProtectedRoute><Link /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><Analytics /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute><Reports /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><Admin /></AdminRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute><Contact /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/workspace" element={
            <ProtectedRoute><Workspace /></ProtectedRoute>
          } />
          <Route path="/qrcode" element={
            <ProtectedRoute><QrCode /></ProtectedRoute>
          } />
          <Route path="/domains" element={
            <ProtectedRoute><CustomDomains /></ProtectedRoute>
          } />
          <Route path="/api-access" element={
            <ProtectedRoute><ApiAccess /></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />
          <Route path="/project-info" element={
            <ProtectedRoute><ProjectInfo /></ProtectedRoute>
          } />

          {/* Public utility pages */}
          <Route path="/link-password" element={<LinkPassword />} />
          <Route path="/expired" element={<ExpiredPage />} />
          <Route path="/limit-reached" element={<LimitReachedPage />} />
          <Route path="/disabled" element={<DisabledPage />} />

          {/* 404 — must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default AppRoutes;