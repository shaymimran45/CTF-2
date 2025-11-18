import { create } from 'zustand'
import api, { Challenge, Submission } from '../lib/api'

interface ChallengeState {
  challenges: Challenge[]
  categories: string[]
  selectedCategory: string
  selectedDifficulty: string
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchChallenges: () => Promise<void>
  fetchCategories: () => Promise<void>
  submitFlag: (challengeId: string, flag: string) => Promise<Submission | null>
  setCategory: (category: string) => void
  setDifficulty: (difficulty: string) => void
  clearError: () => void
}

export const useChallengeStore = create<ChallengeState>()((set, get) => ({
  challenges: [],
  categories: [],
  selectedCategory: '',
  selectedDifficulty: '',
  isLoading: false,
  error: null,

  fetchChallenges: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { selectedCategory, selectedDifficulty } = get()
      const response = await api.getChallenges(
        selectedCategory || undefined,
        selectedDifficulty || undefined
      )
      
      if (response.success && response.data) {
        set({ challenges: response.data.challenges, isLoading: false })
      } else {
        set({ 
          error: response.error || 'Failed to fetch challenges', 
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: 'Failed to fetch challenges', 
        isLoading: false 
      })
    }
  },

  fetchCategories: async () => {
    try {
      const response = await api.getCategories()
      
      if (response.success && response.data) {
        set({ categories: response.data.categories })
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  },

  submitFlag: async (challengeId: string, flag: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.submitFlag(challengeId, flag)
      
      if (response.success && response.data) {
        // Update the challenge as solved
        set((state) => ({
          challenges: state.challenges.map(challenge =>
            challenge.id === challengeId
              ? { ...challenge, solved: response.data!.correct }
              : challenge
          ),
          isLoading: false
        }))
        
        return response.data
      } else {
        set({ 
          error: response.error || 'Failed to submit flag', 
          isLoading: false 
        })
        return null
      }
    } catch (error) {
      set({ 
        error: 'Failed to submit flag', 
        isLoading: false 
      })
      return null
    }
  },

  setCategory: (category: string) => {
    set({ selectedCategory: category })
  },

  setDifficulty: (difficulty: string) => {
    set({ selectedDifficulty: difficulty })
  },

  clearError: () => {
    set({ error: null })
  }
}))