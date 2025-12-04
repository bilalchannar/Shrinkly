import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "../Auth/Auth.jsx";
import Home from "../Pages/Home.jsx";
import Link from "../Pages/Link.jsx";
import Analytics from "../Pages/Analytics.jsx";
import Contact from "../Pages/Contact.jsx";
import Profile from "../Pages/Profile.jsx";
import QrCode from "../Pages/QrCode.jsx";

const AppRoutes = () => {
return (
<BrowserRouter>
<Routes>
<Route path="/" element={<Auth />} />
<Route path="/home" element={<Home />} />
<Route path="/link" element={<Link />} />
<Route path="/analytics" element={<Analytics />} />
<Route path="/contact" element={<Contact />} />
<Route path="/profile" element={<Profile />} />
<Route path="/qrcode" element={<QrCode />} />
</Routes>
</BrowserRouter>
);
};

export default AppRoutes;