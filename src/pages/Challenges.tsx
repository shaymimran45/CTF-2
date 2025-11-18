import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChallengeStore } from '../stores/challengeStore'
import { useAuthStore } from '../stores/authStore'
import { Trophy, Filter, Search, Flag, Download, Lightbulb, CheckCircle } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'

const Challenges: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    challenges,
    categories,
    selectedCategory,
    selectedDifficulty,
    isLoading,
    error,
    fetchChallenges,
    fetchCategories,
    setCategory,
    setDifficulty,
    clearError
  } = useChallengeStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    fetchChallenges()
    fetchCategories()
  }, [user, navigate, fetchChallenges, fetchCategories])

  useEffect(() => {
    fetchChallenges()
  }, [selectedCategory, selectedDifficulty, fetchChallenges])

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'hard': return 'text-red-400 bg-red-400/10'
      case 'insane': return 'text-purple-400 bg-purple-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'web': return '🌐'
      case 'crypto': return '🔐'
      case 'reverse': return '🔍'
      case 'forensics': return '🔬'
      case 'pwn': return '💥'
      case 'stego': return '👻'
      default: return '📝'
    }
  }

  const handleChallengeClick = (challengeId: string) => {
    navigate(`/challenges/${challengeId}`)
  }

  const handleSubmitFlag = (challengeId: string) => {
    navigate(`/challenges/${challengeId}`)
  }

  const goBack = () => navigate(-1)

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 header-horror">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={goBack} className="px-2 py-1 rounded btn-blood flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h1 className="text-3xl font-bold text-white horror-title">Challenges</h1>
              <div className="mt-2 horror-divider"></div>
              <p className="text-gray-400 mt-1">
                Test your skills across {categories.length} categories
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Your Score</p>
                <p className="text-2xl font-bold text-red-400">{0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent card-horror"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 rounded-lg text-white btn-blood transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryIcon(category)} {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="insane">Insane</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {/* Challenges Grid */}
        {!isLoading && filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No challenges found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory || selectedDifficulty
                ? 'Try adjusting your search or filter criteria'
                : 'No challenges available at the moment'
              }
            </p>
          </div>
        )}

        {!isLoading && filteredChallenges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map(challenge => (
              <div
                key={challenge.id}
                className={`card-horror border rounded-lg p-6 transition-all cursor-pointer horror-glow ${
                  challenge.solved
                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                    : 'border-gray-700'
                }`}
                onClick={() => handleChallengeClick(challenge.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(challenge.category)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-red-400">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">
                        {challenge.category}
                      </p>
                    </div>
                  </div>
                  {challenge.solved && (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  )}
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {challenge.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                  <div className="flex items-center space-x-2 text-red-400">
                    <Trophy className="h-4 w-4" />
                    <span className="font-semibold">{challenge.points}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    {challenge.files && challenge.files.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{challenge.files.length}</span>
                      </div>
                    )}
                    {challenge.hints && challenge.hints.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Lightbulb className="h-4 w-4" />
                        <span>{challenge.hints.length}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flag className="h-4 w-4" />
                    <span>{challenge._count?.solves || 0} solves</span>
                  </div>
                </div>

                {!challenge.solved && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSubmitFlag(challenge.id)
                    }}
                    className="w-full mt-4 px-4 py-2 text-white rounded-lg font-medium transition-colors horror-glow btn-blood"
                  >
                    Submit Flag
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Challenges