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
import { useTheme } from "@/hooks/useTheme";
import Team from "@/pages/Team";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function App() {
  const { theme } = useTheme()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white font-bold horror-title">CTF Platform</Link>
              <nav className="hidden md:flex items-center gap-3 text-sm">
                <Link to="/challenges" className="text-gray-300 hover:text-white">Challenges</Link>
                <Link to="/leaderboard" className="text-gray-300 hover:text-white">Leaderboard</Link>
                <Link to="/team" className="text-gray-300 hover:text-white">Team</Link>
                <Link to="/profile" className="text-gray-300 hover:text-white">Profile</Link>
                {user?.role === 'admin' && <Link to="/admin" className="text-red-400 hover:text-red-300">Admin</Link>}
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <span className="text-gray-300">{user.username}</span>
                  <button onClick={logout} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                  <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
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
        <footer className="mt-10 py-6 border-t border-gray-700 bg-gray-800">
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
