import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../Components/ProtectedRoute.jsx";
import Auth from "../Auth/Auth.jsx";
import VerifyEmail from "../Auth/VerifyEmail.jsx";
import ForgotPassword from "../Auth/ForgotPassword.jsx";
import ResetPassword from "../Auth/ResetPassword.jsx";
import Home from "../Pages/Home.jsx";
import Link from "../Pages/Link.jsx";
import Analytics from "../Pages/Analytics.jsx";
import Contact from "../Pages/Contact.jsx";
import Profile from "../Pages/Profile.jsx";
import QrCode from "../Pages/QrCode.jsx";
import LinkPassword from "../Pages/LinkPassword.jsx";
import NotFound from "../Pages/NotFound.jsx";

const AppRoutes = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/qrcode" element={
            <ProtectedRoute><QrCode /></ProtectedRoute>
          } />

          {/* Public utility pages */}
          <Route path="/link-password" element={<LinkPassword />} />

          {/* 404 — must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;