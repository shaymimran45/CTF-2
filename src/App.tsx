import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Challenges from "@/pages/Challenges";
import ChallengeDetail from "@/pages/ChallengeDetail";
import Leaderboard from "@/pages/Leaderboard";
import AdminPanel from "@/pages/AdminPanel";
import Profile from "@/pages/Profile";
import Team from "@/pages/Team";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";

export default function App() {
  const { user, logout } = useAuthStore()
  const { theme } = useTheme()
  return (
    <Router>
      <div className={`min-h-screen bg-gray-900 text-white ${theme === 'horror' ? 'horror' : ''}`}>
        <header className="bg-gray-800 header-horror">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white font-bold horror-title hover-shiver">CTF Platform</Link>
              <nav className="hidden md:flex items-center gap-3 text-sm">
                <Link to="/challenges" className="link-horror">Challenges</Link>
                <Link to="/leaderboard" className="link-horror">Leaderboard</Link>
                <Link to="/team" className="link-horror">Team</Link>
                <Link to="/profile" className="link-horror">Profile</Link>
                {user?.role === 'admin' && <Link to="/admin" className="text-red-400 hover:text-red-300 horror-glow">Admin</Link>}
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <span className="text-gray-300">{user.username}</span>
                  <button onClick={logout} className="px-3 py-1 rounded btn-blood">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="link-horror">Login</Link>
                  <Link to="/register" className="link-horror">Register</Link>
                </>
              )}
            </div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
        </Routes>
        <footer className="mt-10 py-6 bg-gray-800 footer-horror">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-400">
            © {new Date().getFullYear()} CTF Platform
          </div>
        </footer>
      </div>
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
      />
    </Router>
  );
}
