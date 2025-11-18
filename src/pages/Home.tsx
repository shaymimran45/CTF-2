import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }, [user, navigate])

  return null
}