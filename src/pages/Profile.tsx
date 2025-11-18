import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { User, Trophy, Target, ArrowLeft } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const goBack = () => navigate(-1)
  const { user, fetchProfile } = useAuthStore()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchProfile?.()
  }, [user, navigate, fetchProfile])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-7 w-7 text-purple-500" />
              <h1 className="text-3xl font-bold text-white horror-title">Profile</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Member since</p>
              <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <button onClick={goBack} className="px-2 py-1 rounded btn-blood flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="mt-2 horror-divider"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6" />
              <div>
                <p className="text-sm text-gray-400">Username</p>
                <p className="text-lg font-semibold">{user.username}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-gray-400">Challenges Solved</p>
                <p className="text-lg font-semibold">{user._count?.solves ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-400">Submissions</p>
                <p className="text-lg font-semibold">{user._count?.submissions ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}