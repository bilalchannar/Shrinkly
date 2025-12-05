import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../Components/ProtectedRoute.jsx";
import Auth from "../Auth/Auth.jsx";
import Home from "../Pages/Home.jsx";
import Link from "../Pages/Link.jsx";
import Analytics from "../Pages/Analytics.jsx";
import Contact from "../Pages/Contact.jsx";
import Profile from "../Pages/Profile.jsx";
import QrCode from "../Pages/QrCode.jsx";

const AppRoutes = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/link" element={
            <ProtectedRoute>
              <Link />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/qrcode" element={
            <ProtectedRoute>
              <QrCode />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;