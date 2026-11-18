import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Materials from "./pages/Materials.jsx";
import Attendance from "./pages/Attendance.jsx";
import Shifts from "./pages/Shifts.jsx";
import Users from "./pages/Users.jsx";
import Rewards from "./pages/Rewards.jsx";
import Lessons from "./pages/Lessons.jsx";
import Challenges from "./pages/Challenges.jsx";
import SoftSkills from "./pages/SoftSkills.jsx";

function readAdminUser() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null");
  } catch {
    return null;
  }
}

function RequireAdmin({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("admin_token");
  const user = readAdminUser();

  // The backend remains the authority; this guard prevents accidental UI access.
  if (!token || user?.role !== "admin") {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function LoginRoute() {
  const token = localStorage.getItem("admin_token");
  if (token && readAdminUser()?.role === "admin") return <Navigate to="/" replace />;
  return <Login />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<RequireAdmin><AdminLayout><Dashboard /></AdminLayout></RequireAdmin>} />
      <Route path="/materials" element={<RequireAdmin><AdminLayout><Materials /></AdminLayout></RequireAdmin>} />
      <Route path="/attendance" element={<RequireAdmin><AdminLayout><Attendance /></AdminLayout></RequireAdmin>} />
      <Route path="/shifts" element={<RequireAdmin><AdminLayout><Shifts /></AdminLayout></RequireAdmin>} />
      <Route path="/users" element={<RequireAdmin><AdminLayout><Users /></AdminLayout></RequireAdmin>} />
      <Route path="/rewards" element={<RequireAdmin><AdminLayout><Rewards /></AdminLayout></RequireAdmin>} />
      <Route path="/lessons" element={<RequireAdmin><AdminLayout><Lessons /></AdminLayout></RequireAdmin>} />
      <Route path="/challenges" element={<RequireAdmin><AdminLayout><Challenges /></AdminLayout></RequireAdmin>} />
      <Route path="/soft-skills" element={<RequireAdmin><AdminLayout><SoftSkills /></AdminLayout></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
