import { create } from 'zustand'
import api, { LeaderboardEntry, Statistics } from '../lib/api'

interface LeaderboardState {
  leaderboard: LeaderboardEntry[]
  statistics: Statistics | null
  type: 'individual' | 'team'
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchLeaderboard: (type?: 'individual' | 'team') => Promise<void>
  fetchStatistics: () => Promise<void>
  setType: (type: 'individual' | 'team') => void
  clearError: () => void
}

export const useLeaderboardStore = create<LeaderboardState>()((set, get) => ({
  leaderboard: [],
  statistics: null,
  type: 'individual',
  isLoading: false,
  error: null,

  fetchLeaderboard: async (type?: 'individual' | 'team') => {
    const currentType = type || get().type
    set({ isLoading: true, error: null, type: currentType })
    
    try {
      const response = await api.getLeaderboard(currentType)
      
      if (response.success && response.data) {
        set({ leaderboard: response.data.leaderboard, isLoading: false })
      } else {
        set({ 
          error: response.error || 'Failed to fetch leaderboard', 
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: 'Failed to fetch leaderboard', 
        isLoading: false 
      })
    }
  },

  fetchStatistics: async () => {
    try {
      const response = await api.getStatistics()
      
      if (response.success && response.data) {
        set({ statistics: response.data })
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  },

  setType: (type: 'individual' | 'team') => {
    set({ type })
    get().fetchLeaderboard(type)
  },

  clearError: () => {
    set({ error: null })
  }
}))