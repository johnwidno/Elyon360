import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicHome from "../pages/Public/Home";
import MemberDashboard from "../pages/Member/Profile";
import AdminDashboard from "../pages/admin/Dashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Site public */}
        <Route path="/" element={<PublicHome />} />

        {/* Espace membre */}
        <Route path="/member" element={<MemberDashboard />} />

        {/* Espace admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
