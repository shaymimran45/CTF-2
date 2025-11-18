import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function AdminPanel() {
  const { user } = useAuthStore()
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Insufficient permissions</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>
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
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
            {isSubmitting ? 'Submitting...' : 'Create Challenge'}
          </button>
        </form>
      </div>
    </div>
  )
}