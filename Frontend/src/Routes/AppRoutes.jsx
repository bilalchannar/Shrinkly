import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import "../Css/Variables.css";
import ProtectedRoute from "../Components/ProtectedRoute.jsx";
import Auth from "../Auth/Auth.jsx";
import VerifyEmail from "../Auth/VerifyEmail.jsx";
import ForgotPassword from "../Auth/ForgotPassword.jsx";
import ResetPassword from "../Auth/ResetPassword.jsx";
import Home from "../Pages/Home.jsx";
import Landing from "../Pages/Landing.jsx";
import Link from "../Pages/Link.jsx";
import Analytics from "../Pages/Analytics.jsx";
import Contact from "../Pages/Contact.jsx";
import Profile from "../Pages/Profile.jsx";
import QrCode from "../Pages/QrCode.jsx";
import LinkPassword from "../Pages/LinkPassword.jsx";
import NotFound from "../Pages/NotFound.jsx";

const AppRoutes = () => {
  return (
    <ThemeProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
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
    </ThemeProvider>
  );
};

export default AppRoutes;