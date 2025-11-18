import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeaderboardStore } from '../stores/leaderboardStore'
import { useAuthStore } from '../stores/authStore'
import { Trophy, Users, User, TrendingUp, Clock, Award } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'

const Leaderboard: React.FC = () => {
  const navigate = useNavigate()
  const goBack = () => navigate(-1)
  const { user } = useAuthStore()
  const {
    leaderboard,
    statistics,
    type,
    isLoading,
    error,
    fetchLeaderboard,
    fetchStatistics,
    setType,
    clearError
  } = useLeaderboardStore()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    fetchLeaderboard()
    fetchStatistics()
  }, [user, navigate, fetchLeaderboard, fetchStatistics])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400 bg-yellow-400/10'
      case 2: return 'text-gray-300 bg-gray-300/10'
      case 3: return 'text-orange-400 bg-orange-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const formatLastSolve = (lastSolve: string | null) => {
    if (!lastSolve) return 'Never'
    
    const date = new Date(lastSolve)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 header-horror">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3 horror-title">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <span>Leaderboard</span>
              </h1>
              <div className="mt-2 horror-divider"></div>
              <p className="text-gray-400 mt-1">
                See how you stack up against other players
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={goBack} className="px-2 py-1 rounded btn-blood flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-400">Your Rank</p>
                <p className="text-2xl font-bold text-red-400">
                  #{leaderboard.findIndex(entry => entry.id === user.id) + 1 || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card-horror rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Challenges</p>
                  <p className="text-2xl font-bold text-white">{statistics.totalChallenges}</p>
                </div>
                <Award className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Solves</p>
                  <p className="text-2xl font-bold text-white">{statistics.totalSolves}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Players</p>
                  <p className="text-2xl font-bold text-white">{statistics.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Leaderboard Type</p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => setType('individual')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        type === 'individual'
                          ? 'bg-red-600 text-white horror-glow'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <User className="h-4 w-4 inline mr-1" />
                      Individual
                    </button>
                    <button
                      onClick={() => setType('team')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        type === 'team'
                          ? 'bg-red-600 text-white horror-glow'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Users className="h-4 w-4 inline mr-1" />
                      Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {!isLoading && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span>{type === 'individual' ? 'Individual' : 'Team'} Rankings</span>
              </h3>
            </div>
            
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No participants yet</h3>
                <p className="text-gray-500">Be the first to solve a challenge!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {type === 'individual' ? 'Player' : 'Team'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Solves
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Last Solve
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {leaderboard.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`hover:bg-gray-700 transition-colors ${
                          entry.id === user.id ? 'bg-gray-700/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankColor(index + 1)}`}>
                            {getRankIcon(index + 1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-white">
                              {type === 'individual' ? entry.username : entry.name}
                            </div>
                            {entry.id === user.id && (
                              <span className="ml-2 px-2 py-1 text-xs bg-cyan-600 text-white rounded">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm font-semibold text-white">{entry.score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {entry.solves}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatLastSolve(entry.lastSolve)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard