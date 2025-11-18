import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api, { MyTeam } from '../lib/api'
import { Users, UserPlus, LogOut, KeyRound, Copy, UserMinus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function Team() {
  const navigate = useNavigate()
  const goBack = () => navigate(-1)
  const { user } = useAuthStore()
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxMembers, setMaxMembers] = useState(5)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchMyTeam()
  }, [user, navigate])

  const fetchMyTeam = async () => {
    const res = await api.getMyTeam()
    if (res.success) setMyTeam(res.data.team)
  }

  const createTeam = async () => {
    if (!name.trim()) return
    setLoading(true)
    const res = await api.createTeam(name.trim(), description.trim() || undefined, maxMembers)
    if (res.success) {
      await fetchMyTeam()
    }
    setLoading(false)
  }

  const joinTeam = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    const res = await api.joinTeam(inviteCode.trim())
    if (res.success) await fetchMyTeam()
    setLoading(false)
  }

  const leaveTeam = async () => {
    setLoading(true)
    const res = await api.leaveTeam()
    if (res.success) setMyTeam(null)
    setLoading(false)
  }

  const copyInvite = async () => {
    if (!myTeam?.inviteCode) return
    try {
      await navigator.clipboard.writeText(myTeam.inviteCode)
      toast.success('Invite code copied')
    } catch {
      toast.error('Failed to copy invite code')
    }
  }

  const [kickingId, setKickingId] = useState<string | null>(null)
  const kickMember = async (memberId: string) => {
    setKickingId(memberId)
    const res = await api.kickMember(memberId)
    if (res.success) {
      toast.success('Member kicked')
      await fetchMyTeam()
    } else {
      toast.error(res.error || 'Failed to kick member')
    }
    setKickingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-7 w-7 text-purple-500" />
              <h1 className="text-3xl font-bold text-white horror-title">Team</h1>
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
        {!myTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-horror rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><UserPlus className="h-5 w-5"/> Create Team</h3>
              <div className="space-y-3">
                <input placeholder="Team name" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={name} onChange={(e) => setName(e.target.value)} />
                <input placeholder="Description" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={description} onChange={(e) => setDescription(e.target.value)} />
                <input type="number" placeholder="Max members" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} />
                <button onClick={createTeam} disabled={loading} className="px-3 py-2 text-white rounded btn-blood horror-glow">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
            <div className="card-horror rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><KeyRound className="h-5 w-5"/> Join Team</h3>
              <div className="space-y-3">
                <input placeholder="Invite code" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                <button onClick={joinTeam} disabled={loading} className="px-3 py-2 text-white rounded btn-blood horror-glow">{loading ? 'Joining...' : 'Join'}</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-horror rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{myTeam.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">Invite: {myTeam.inviteCode}</p>
                  <button onClick={copyInvite} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1">
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-400">Members: {myTeam.memberships.length}/{myTeam.maxMembers}</p>
              </div>
              <button onClick={leaveTeam} disabled={loading} className="px-3 py-2 text-white rounded btn-blood"><LogOut className="h-4 w-4 inline mr-1"/> Leave</button>
            </div>
            <div className="mt-4 space-y-2">
              {myTeam.memberships.map(m => (
                <div key={m.user.id} className="flex items-center justify-between text-sm text-gray-200">
                  <span>{m.user.username}</span>
                  {user?.id === myTeam.leaderId && m.user.id !== user.id && (
                    <button
                      onClick={() => kickMember(m.user.id)}
                      disabled={kickingId === m.user.id}
                      className="px-2 py-1 text-xs text-white rounded btn-blood flex items-center gap-1"
                    >
                      <UserMinus className="h-3 w-3" />
                      {kickingId === m.user.id ? 'Kicking...' : 'Kick'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}