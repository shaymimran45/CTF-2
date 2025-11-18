import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useChallengeStore } from '../stores/challengeStore'
import { useLeaderboardStore } from '../stores/leaderboardStore'
import { Trophy, Users, Target, Clock, User, LogOut } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const { challenges, fetchChallenges, isLoading } = useChallengeStore()
  const { statistics, fetchStatistics } = useLeaderboardStore()

  useEffect(() => {
    fetchChallenges()
    fetchStatistics()
  }, [])

  const totalChallenges = challenges.length
  const solvedChallenges = challenges.filter(c => c.solved).length
  const totalPoints = challenges.filter(c => c.solved).reduce((sum, c) => sum + c.points, 0)

  const categories = [...new Set(challenges.map(c => c.category))]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-red-500" />
              <h1 className="ml-3 text-2xl font-bold text-white horror-title">CTF Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-300">
                <User className="h-5 w-5 mr-2" />
                <span>{user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Challenges
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {totalChallenges}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Solved
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {solvedChallenges}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Points
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {totalPoints}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Categories
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {categories.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Info */}
        <div className="bg-gray-800 overflow-hidden shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white horror-title">CTF Competition</h3>
                <p className="text-sm text-gray-400">Stay sharp and hunt flags</p>
              </div>
              <div className="flex items-center text-red-400">
                <Clock className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {statistics.categories.map((c) => (
                  <span key={c.category} className="px-3 py-1 rounded-full bg-gray-700 text-sm text-gray-200">
                    {c.category} ({c._count.id})
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Solves</h3>
              {statistics.recentSolves.length === 0 ? (
                <div className="text-gray-400">No recent activity</div>
              ) : (
                <div className="space-y-2">
                  {statistics.recentSolves.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm text-gray-200">
                      <span>{s.user.username} solved {s.challenge.title}</span>
                      <span className="text-yellow-500">+{s.pointsAwarded}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/challenges"
            className="bg-gray-800 overflow-hidden shadow rounded-lg hover:bg-gray-700 transition-colors horror-glow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Challenges</h3>
                  <p className="text-sm text-gray-400">View and solve challenges</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-gray-800 overflow-hidden shadow rounded-lg hover:bg-gray-700 transition-colors horror-glow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Leaderboard</h3>
                  <p className="text-sm text-gray-400">View rankings</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="bg-gray-800 overflow-hidden shadow rounded-lg hover:bg-gray-700 transition-colors horror-glow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Profile</h3>
                  <p className="text-sm text-gray-400">View your statistics</p>
                </div>
              </div>
            </div>
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="bg-gray-800 overflow-hidden shadow rounded-lg hover:bg-gray-700 transition-colors horror-glow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-white">Admin Panel</h3>
                    <p className="text-sm text-gray-400">Create and manage challenges</p>
                  </div>
                </div>
              </div>
            </Link>
          )}
          <Link
            to="/team"
            className="bg-gray-800 overflow-hidden shadow rounded-lg hover:bg-gray-700 transition-colors horror-glow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Team</h3>
                  <p className="text-sm text-gray-400">Create or join a team</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}