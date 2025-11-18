import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { User } from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
  checkAuth: () => Promise<void>
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.login(email, password)
          
          if (response.success && response.data) {
            const { user, token } = response.data
            localStorage.setItem('token', token)
            set({ user, token, isLoading: false })
          } else {
            set({ 
              error: response.error || 'Login failed', 
              isLoading: false 
            })
            throw new Error(response.error || 'Login failed')
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed', 
            isLoading: false 
          })
          throw error
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.register(email, username, password)
          
          if (response.success && response.data) {
            const { user, token } = response.data
            localStorage.setItem('token', token)
            set({ user, token, isLoading: false })
          } else {
            set({ 
              error: response.error || 'Registration failed', 
              isLoading: false 
            })
            throw new Error(response.error || 'Registration failed')
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed', 
            isLoading: false 
          })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, error: null })
      },

      clearError: () => {
        set({ error: null })
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) return

        set({ isLoading: true })
        
        try {
          const response = await api.getProfile()
          
          if (response.success && response.data) {
            set({ user: response.data.user, isLoading: false })
          } else {
            // Token is invalid, logout
            get().logout()
          }
        } catch (error) {
          // Error checking auth, logout
      get().logout()
    }
  },

  fetchProfile: async () => {
    const token = get().token
    if (!token) return

    try {
      const response = await api.getProfile()
      
      if (response.success && response.data) {
        set({ user: response.data.user })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token
      })
    }
  )
)