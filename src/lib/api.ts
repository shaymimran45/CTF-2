const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

export interface User {
  id: string
  email: string
  username: string
  role: string
  teamId?: string
  createdAt: string
  _count?: {
    solves: number
    submissions: number
  }
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  points: number
  flag: string
  isVisible: boolean
  solved?: boolean
  _count?: {
    solves: number
  }
  files?: ChallengeFile[]
  hints?: Hint[]
}

export interface ChallengeFile {
  id: string
  filename: string
  fileSize: number
  uploadedAt: string
}

export interface Hint {
  id: string
  content: string
  penalty: number
}

export interface Submission {
  correct: boolean
  points: number
  message: string
}

export interface LeaderboardEntry {
  id: string
  username?: string
  name?: string
  score: number
  solves: number
  lastSolve: string | null
}

export interface Statistics {
  totalChallenges: number
  totalSolves: number
  totalUsers: number
  categories: Array<{ category: string; _count: { id: number } }>
  difficulties: Array<{ difficulty: string; _count: { id: number } }>
  recentSolves: Array<{
    id: string
    solvedAt: string
    pointsAwarded: number
    user: { username: string }
    challenge: { title: string; category: string; points: number }
  }>
}

export interface MyTeam {
  id: string
  name: string
  description?: string
  inviteCode: string
  maxMembers: number
  leaderId: string
  memberships: Array<{ joinedAt: string; user: { id: string; username: string } }>
}

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        }
      }

      return {
        success: true,
        data,
        message: data.message,
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      }
    }
  }

  // Auth endpoints
  async register(email: string, username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    })
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/profile')
  }

  // Challenge endpoints
  async getChallenges(category?: string, difficulty?: string): Promise<ApiResponse<{ challenges: Challenge[] }>> {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (difficulty) params.append('difficulty', difficulty)
    
    return this.request(`/challenges?${params.toString()}`)
  }

  async getChallenge(id: string): Promise<ApiResponse<Challenge>> {
    return this.request(`/challenges/${id}`)
  }

  async submitFlag(id: string, flag: string): Promise<ApiResponse<Submission>> {
    return this.request(`/challenges/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ flag }),
    })
  }

  async getCategories(): Promise<ApiResponse<{ categories: string[] }>> {
    return this.request('/challenges/categories')
  }

  // Leaderboard endpoints
  async getLeaderboard(type: 'individual' | 'team' = 'individual'): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    const params = new URLSearchParams()
    params.append('type', type)
    
    return this.request(`/leaderboard?${params.toString()}`)
  }

  async getStatistics(): Promise<ApiResponse<Statistics>> {
    return this.request('/statistics')
  }

  async createChallenge(form: FormData): Promise<ApiResponse<{ challenge: Challenge }>> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/admin/challenges`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      const data = await response.json()
      if (!response.ok) {
        return { success: false, error: data.error || 'An error occurred' }
      }
      return { success: true, data }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async getAdminChallenges(): Promise<ApiResponse<{ challenges: Challenge[] }>> {
    return this.request('/admin/challenges')
  }

  async updateChallenge(id: string, payload: Partial<Pick<Challenge, 'title' | 'description' | 'category' | 'difficulty' | 'points' | 'flag' | 'isVisible'>>): Promise<ApiResponse<{ challenge: Challenge }>> {
    return this.request(`/admin/challenges/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
  }

  async toggleChallengeVisibility(id: string): Promise<ApiResponse<{ challenge: Challenge }>> {
    return this.request(`/admin/challenges/${id}/toggle-visibility`, {
      method: 'POST'
    })
  }

  async deleteAdminChallenge(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/admin/challenges/${id}`, { method: 'DELETE' })
  }

  async deleteAllChallenges(): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.request('/admin/challenges', { method: 'DELETE' })
  }

  async setAllVisibility(isVisible: boolean): Promise<ApiResponse<{ updatedCount: number }>> {
    return this.request('/admin/challenges/visibility', {
      method: 'POST',
      body: JSON.stringify({ isVisible })
    })
  }

  async addHint(challengeId: string, content: string, penalty = 0): Promise<ApiResponse<{ hint: { id: string } }>> {
    return this.request(`/admin/challenges/${challengeId}/hints`, {
      method: 'POST',
      body: JSON.stringify({ content, penalty })
    })
  }

  async updateHint(hintId: string, payload: { content?: string; penalty?: number }): Promise<ApiResponse<{ hint: { id: string } }>> {
    return this.request(`/admin/hints/${hintId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
  }

  async deleteHint(hintId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/admin/hints/${hintId}`, { method: 'DELETE' })
  }

  async addFiles(challengeId: string, files: File[]): Promise<ApiResponse<{ challenge: Challenge }>> {
    const form = new FormData()
    files.forEach((f) => form.append('files', f, f.name))
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/admin/challenges/${challengeId}/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    })
    const data = await response.json()
    if (!response.ok) return { success: false, error: data.error || 'An error occurred' }
    return { success: true, data }
  }

  async deleteFile(fileId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/admin/files/${fileId}`, { method: 'DELETE' })
  }

  async createTeam(name: string, description?: string, maxMembers?: number): Promise<ApiResponse<{ team: { id: string } }>> {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description, maxMembers })
    })
  }

  async joinTeam(inviteCode: string): Promise<ApiResponse<{ joined: boolean }>> {
    return this.request('/teams/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    })
  }

  async leaveTeam(): Promise<ApiResponse<{ left: boolean }>> {
    return this.request('/teams/leave', { method: 'POST' })
  }

  async getMyTeam(): Promise<ApiResponse<{ team: MyTeam | null }>> {
    return this.request('/teams/me')
  }

  async kickMember(memberId: string): Promise<ApiResponse<{ kicked: boolean }>> {
    return this.request('/teams/kick', {
      method: 'POST',
      body: JSON.stringify({ memberId })
    })
  }

  async createCompetition(payload: {
    name: string
    description?: string
    startTime: string
    endTime: string
    competitionType?: string
    isPublic?: boolean
    challengeIds?: string[]
  }): Promise<ApiResponse<{ competition: { id: string } }>> {
    return this.request('/admin/competitions', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}

export const api = new ApiClient()
export default api