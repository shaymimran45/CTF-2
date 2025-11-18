import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'individual' } = req.query

    if (type === 'team') {
      // Team leaderboard
      const teamScores = await prisma.team.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              solves: true
            }
          },
          solves: {
            select: {
              pointsAwarded: true,
              solvedAt: true
            },
            orderBy: {
              solvedAt: 'desc'
            }
          }
        }
      })

      const teamLeaderboard = teamScores.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        score: team.solves.reduce((sum, solve) => sum + solve.pointsAwarded, 0),
        solves: team._count.solves,
        lastSolve: team.solves[0]?.solvedAt || null
      }))

      teamLeaderboard.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score
        if (a.lastSolve && b.lastSolve) {
          return new Date(a.lastSolve).getTime() - new Date(b.lastSolve).getTime()
        }
        return a.lastSolve ? -1 : 1
      })

      res.json({ leaderboard: teamLeaderboard })
    } else {
      // Individual leaderboard
      const userScores = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              solves: true
            }
          },
          solves: {
            select: {
              pointsAwarded: true,
              solvedAt: true
            },
            orderBy: {
              solvedAt: 'desc'
            }
          }
        }
      })

      const individualLeaderboard = userScores.map(user => ({
        id: user.id,
        username: user.username,
        score: user.solves.reduce((sum, solve) => sum + solve.pointsAwarded, 0),
        solves: user._count.solves,
        lastSolve: user.solves[0]?.solvedAt || null
      }))

      individualLeaderboard.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score
        if (a.lastSolve && b.lastSolve) {
          return new Date(a.lastSolve).getTime() - new Date(b.lastSolve).getTime()
        }
        return a.lastSolve ? -1 : 1
      })

      res.json({ leaderboard: individualLeaderboard })
    }
  } catch (error) {
    console.error('Get leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalChallenges = await prisma.challenge.count({
      where: { isVisible: true }
    })

    const totalSolves = await prisma.solve.count()

    const totalUsers = await prisma.user.count()

    const categoryStats = await prisma.challenge.groupBy({
      by: ['category'],
      where: { isVisible: true },
      _count: {
        id: true
      }
    })

    const difficultyStats = await prisma.challenge.groupBy({
      by: ['difficulty'],
      where: { isVisible: true },
      _count: {
        id: true
      }
    })

    const recentSolves = await prisma.solve.findMany({
      take: 10,
      orderBy: {
        solvedAt: 'desc'
      },
      select: {
        id: true,
        solvedAt: true,
        pointsAwarded: true,
        user: {
          select: {
            username: true
          }
        },
        challenge: {
          select: {
            title: true,
            category: true,
            points: true
          }
        }
      }
    })

    res.json({
      totalChallenges,
      totalSolves,
      totalUsers,
      categories: categoryStats,
      difficulties: difficultyStats,
      recentSolves
    })
  } catch (error) {
    console.error('Get statistics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}