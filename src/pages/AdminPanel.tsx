import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function AdminPanel() {
  const { user } = useAuthStore()
  const [adminChallenges, setAdminChallenges] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'web',
    difficulty: 'medium',
    points: 100,
    flag: '',
    isVisible: true
  })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('web')
  const [difficulty, setDifficulty] = useState('medium')
  const [points, setPoints] = useState(100)
  const [flag, setFlag] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const [files, setFiles] = useState<FileList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('description', description)
      form.append('category', category)
      form.append('difficulty', difficulty)
      form.append('points', String(points))
      form.append('flag', flag)
      form.append('isVisible', String(isVisible))
      if (files) {
        Array.from(files).forEach((f) => form.append('files', f, f.name))
      }
      const res = await api.createChallenge(form)
      if (res.success) {
        toast.success('Challenge created')
        setTitle('')
        setDescription('')
        setCategory('web')
        setDifficulty('medium')
        setPoints(100)
        setFlag('')
        setIsVisible(true)
        setFiles(null)
      } else {
        toast.error(res.error || 'Failed to create challenge')
      }
    } catch {
      toast.error('Failed to create challenge')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchAdminChallenges = async () => {
    setLoadingList(true)
    const res = await api.getAdminChallenges()
    if (res.success && res.data) {
      setAdminChallenges(res.data.challenges)
    }
    setLoadingList(false)
  }

  const handleToggleVisibility = async (id: string) => {
    const res = await api.toggleChallengeVisibility(id)
    if (res.success && res.data) {
      setAdminChallenges((prev) => prev.map(c => c.id === id ? res.data.challenge : c))
      toast.success('Visibility updated')
    } else {
      toast.error(res.error || 'Failed to update visibility')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await api.deleteAdminChallenge(id)
    if (res.success) {
      setAdminChallenges((prev) => prev.filter(c => c.id !== id))
      toast.success('Challenge deleted')
    } else {
      toast.error(res.error || 'Failed to delete')
    }
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setEditForm({
      title: c.title || '',
      description: c.description || '',
      category: c.category || 'web',
      difficulty: c.difficulty || 'medium',
      points: c.points || 100,
      flag: c.flag || '',
      isVisible: !!c.isVisible
    })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (name === 'points' ? Number(value) : value) }))
  }

  const submitEdit = async () => {
    if (!editing) return
    const res = await api.updateChallenge(editing.id, editForm)
    if (res.success && res.data) {
      setAdminChallenges(prev => prev.map(c => c.id === editing.id ? res.data.challenge : c))
      setEditing(null)
      toast.success('Challenge updated')
    } else {
      toast.error(res.error || 'Failed to update')
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminChallenges()
    }
  }, [user])

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Insufficient permissions</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-white mb-6">Admin Panel</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg">
          <div>
            <label className="block text-gray-300 mb-2">Title</label>
            <input className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea className="w-full px-3 py-2 rounded bg-gray-700 text-white" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Category</label>
              <select className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="web">web</option>
                <option value="crypto">crypto</option>
                <option value="reverse">reverse</option>
                <option value="forensics">forensics</option>
                <option value="pwn">pwn</option>
                <option value="stego">stego</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Difficulty</label>
              <select className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Points</label>
              <input type="number" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Flag</label>
              <input className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={flag} onChange={(e) => setFlag(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input id="visible" type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
            <label htmlFor="visible" className="text-gray-300">Visible</label>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Files</label>
            <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="text-gray-300" />
          </div>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 horror-glow">
            {isSubmitting ? 'Submitting...' : 'Create Challenge'}
          </button>
        </form>

        <div className="mt-10 bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Manage Challenges</h2>
            <div className="flex items-center gap-2">
              <button onClick={fetchAdminChallenges} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Refresh</button>
              <button onClick={async () => { const r = await api.setAllVisibility(true); if (r.success) { toast.success('All visible'); fetchAdminChallenges() } else { toast.error(r.error || 'Failed') } }} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Show All</button>
              <button onClick={async () => { const r = await api.setAllVisibility(false); if (r.success) { toast.success('All hidden'); fetchAdminChallenges() } else { toast.error(r.error || 'Failed') } }} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">Hide All</button>
              <button onClick={async () => { const r = await api.deleteAllChallenges(); if (r.success) { toast.success('All deleted'); setAdminChallenges([]) } else { toast.error(r.error || 'Failed') } }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete All</button>
            </div>
          </div>
          {loadingList ? (
            <div className="text-gray-300">Loading...</div>
          ) : adminChallenges.length === 0 ? (
            <div className="text-gray-400">No challenges found</div>
          ) : (
            <div className="space-y-3">
              {adminChallenges.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{c.title}</div>
                    <div className="text-sm text-gray-300">{c.category} • {c.points} pts</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(c)} className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-500">Edit</button>
                    <button onClick={() => handleToggleVisibility(c.id)} className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-500">
                      {c.isVisible ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Edit Challenge</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 mb-1">Title</label>
                  <input name="title" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={editForm.title} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Description</label>
                  <textarea name="description" className="w-full px-3 py-2 rounded bg-gray-700 text-white" rows={4} value={editForm.description} onChange={handleEditChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Category</label>
                    <select name="category" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={editForm.category} onChange={handleEditChange}>
                      <option value="web">web</option>
                      <option value="crypto">crypto</option>
                      <option value="reverse">reverse</option>
                      <option value="forensics">forensics</option>
                      <option value="pwn">pwn</option>
                      <option value="stego">stego</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Difficulty</label>
                    <select name="difficulty" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={editForm.difficulty} onChange={handleEditChange}>
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Points</label>
                    <input name="points" type="number" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={editForm.points} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Flag</label>
                    <input name="flag" className="w-full px-3 py-2 rounded bg-gray-700 text-white" value={editForm.flag} onChange={handleEditChange} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input id="editVisible" name="isVisible" type="checkbox" checked={editForm.isVisible} onChange={handleEditChange} />
                  <label htmlFor="editVisible" className="text-gray-300">Visible</label>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-500">Cancel</button>
                <button onClick={submitEdit} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 horror-glow">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}