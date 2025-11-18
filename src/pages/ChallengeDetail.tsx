import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChallengeStore } from '../stores/challengeStore'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { Flag, Download, Lightbulb, ArrowLeft, CheckCircle, XCircle, Trophy } from 'lucide-react'
import { toast } from 'sonner'

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { submitFlag } = useChallengeStore()
  
  const [challenge, setChallenge] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [flagInput, setFlagInput] = useState('')
  const [showHint, setShowHint] = useState<number | null>(null)
  const [usedHints, setUsedHints] = useState<number[]>([])
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (id) {
      fetchChallenge()
    }
  }, [id, user, navigate])

  const fetchChallenge = async () => {
    try {
      const response = await api.getChallenge(id!)
      if (response.success && response.data) {
        setChallenge(response.data)
      } else {
        toast.error('Failed to load challenge')
        navigate('/challenges')
      }
    } catch (error) {
      toast.error('Error loading challenge')
      navigate('/challenges')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flagInput.trim()) return

    setSubmitting(true)
    try {
      const result = await submitFlag(id!, flagInput.trim())
      if (result) {
        if (result.correct) {
          toast.success(`Correct! You earned ${result.points} points!`)
          setChallenge({ ...challenge, solved: true })
          setFlagInput('')
          // Refresh user data to update score
          await useAuthStore.getState().fetchProfile()
        } else {
          toast.error('Incorrect flag. Try again!')
        }
      }
    } catch (error) {
      toast.error('Error submitting flag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUseHint = (hintId: string, penalty: number) => {
    if (usedHints.includes(parseInt(hintId))) return
    
    setUsedHints([...usedHints, parseInt(hintId)])
    toast.info(`Hint unlocked! ${penalty > 0 ? `${penalty} point penalty applied.` : ''}`)
  }

  const downloadFile = async (fileId: string, filename: string) => {
    try {
      setDownloadingFileId(fileId)
      const token = localStorage.getItem('token')
      const base = import.meta.env.VITE_API_URL || '/api'
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${base}/files/${fileId}`, { headers })
      if (!res.ok) {
        toast.error('Download failed')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Error downloading file')
    } finally {
      setDownloadingFileId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Challenge not found</h2>
          <button
            onClick={() => navigate('/challenges')}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Back to challenges
          </button>
        </div>
      </div>
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-red-400'
      case 'insane': return 'text-purple-400'
      default: return 'text-gray-400'
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/challenges')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Challenges</span>
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-400">Your Score</p>
              <p className="text-2xl font-bold text-red-400">{0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Challenge Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{getCategoryIcon(challenge.category)}</span>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-white horror-title">{challenge.title}</h1>
                  {challenge.solved && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <CheckCircle className="h-6 w-6" />
                      <span className="font-medium">Solved</span>
                    </div>
                  )}
                </div>
                <div className="horror-divider mb-3"></div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getDifficultyColor(challenge.difficulty)} bg-gray-700`}>
                    {challenge.difficulty}
                  </span>
                  <span className="text-gray-400 capitalize">{challenge.category}</span>
                  <div className="flex items-center space-x-1 text-cyan-400">
                    <Trophy className="h-4 w-4" />
                    <span className="font-semibold">{challenge.points} points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Files */}
            {challenge.files && challenge.files.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Challenge Files</span>
                </h3>
                <div className="space-y-2">
                  {challenge.files.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{file.filename}</p>
                        <p className="text-sm text-gray-400">
                          {(file.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => downloadFile(file.id, file.filename)}
                        disabled={downloadingFileId === file.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors horror-glow"
                      >
                        {downloadingFileId === file.id ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flag Submission */}
            {!challenge.solved && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Flag className="h-5 w-5" />
                  <span>Submit Flag</span>
                </h3>
                <form onSubmit={handleSubmitFlag} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Flag Format: e.g., CTF&#123;text&#125;
                    </label>
                    <input
                      type="text"
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      placeholder="Enter flag here..."
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      disabled={submitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !flagInput.trim()}
                    className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Flag'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Challenge Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Solves:</span>
                  <span className="text-white font-medium">{challenge._count?.solves || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">First Blood:</span>
                  <span className="text-yellow-400 font-medium">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Status:</span>
                  <span className={challenge.solved ? 'text-green-400 font-medium' : 'text-gray-400'}>
                    {challenge.solved ? 'Solved' : 'Not Attempted'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hints */}
            {challenge.hints && challenge.hints.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Hints</span>
                </h3>
                <div className="space-y-3">
                  {challenge.hints.map((hint: any, index: number) => {
                    const isUsed = usedHints.includes(parseInt(hint.id))
                    const isRevealed = showHint === parseInt(hint.id)
                    
                    return (
                      <div key={hint.id} className="border border-gray-600 rounded-lg">
                        <button
                          onClick={() => {
                            if (!isUsed && !isRevealed) {
                              handleUseHint(hint.id, hint.penalty)
                              setShowHint(parseInt(hint.id))
                            } else if (isUsed) {
                              setShowHint(showHint === parseInt(hint.id) ? null : parseInt(hint.id))
                            }
                          }}
                          className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors"
                          disabled={!isUsed && !isRevealed && challenge.solved}
                        >
                          <div className="flex items-center space-x-2">
                            <Lightbulb className={`h-4 w-4 ${isUsed ? 'text-yellow-400' : 'text-gray-400'}`} />
                            <span className="text-white font-medium">Hint {index + 1}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {hint.penalty > 0 && (
                              <span className="text-xs text-red-400">-{hint.penalty}pts</span>
                            )}
                            <span className="text-gray-400">
                              {isUsed || isRevealed ? '▼' : '▶'}
                            </span>
                          </div>
                        </button>
                        {(isUsed || isRevealed) && (
                          <div className="px-3 pb-3 text-gray-300 text-sm">
                            {hint.content}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChallengeDetail