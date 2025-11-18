import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthenticatedRequest } from '../lib/auth'

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

export const createTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const leaderId = req.user!.id
    const { name, description, maxMembers } = req.body as { name: string; description?: string; maxMembers?: number | string }
    if (!name) { res.status(400).json({ error: 'Name required' }); return }
    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        leaderId,
        maxMembers: typeof maxMembers !== 'undefined' ? Number(maxMembers) : undefined
      }
    })
    await prisma.teamMember.create({ data: { teamId: team.id, userId: leaderId } })
    await prisma.user.update({ where: { id: leaderId }, data: { teamId: team.id } })
    res.status(201).json({ team })
  } catch (error) {
    console.error('Create team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const joinTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { inviteCode } = req.body as { inviteCode: string }
    if (!inviteCode) { res.status(400).json({ error: 'Invite code required' }); return }
    const team = await prisma.team.findUnique({ where: { inviteCode } })
    if (!team) { res.status(404).json({ error: 'Team not found' }); return }
    const memberCount = await prisma.teamMember.count({ where: { teamId: team.id } })
    if (memberCount >= team.maxMembers) { res.status(400).json({ error: 'Team is full' }); return }
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId } },
      update: {},
      create: { teamId: team.id, userId }
    })
    await prisma.user.update({ where: { id: userId }, data: { teamId: team.id } })
    res.json({ joined: true })
  } catch (error) {
    console.error('Join team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const leaveTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.teamId) { res.status(400).json({ error: 'Not in a team' }); return }
    const team = await prisma.team.findUnique({ where: { id: user.teamId } })
    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: user.teamId, userId } } }).catch(() => {})
    await prisma.user.update({ where: { id: userId }, data: { teamId: null } })
    if (team && team.leaderId === userId) {
      const remaining = await prisma.teamMember.findMany({ where: { teamId: team.id } })
      if (remaining.length === 0) {
        await prisma.team.delete({ where: { id: team.id } })
      } else {
        await prisma.team.update({ where: { id: team.id }, data: { leaderId: remaining[0].userId } })
      }
    }
    res.json({ left: true })
  } catch (error) {
    console.error('Leave team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMyTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.teamId) { res.json({ team: null }); return }
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        name: true,
        description: true,
        inviteCode: true,
        maxMembers: true,
        leaderId: true,
        memberships: {
          select: {
            joinedAt: true,
            user: { select: { id: true, username: true } }
          }
        }
      }
    })
    res.json({ team })
  } catch (error) {
    console.error('Get my team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const kickMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user!.id
    const { memberId } = req.body as { memberId?: string }

    if (!memberId) {
      res.status(400).json({ error: 'Member ID required' })
      return
    }

    const requester = await prisma.user.findUnique({ where: { id: requesterId } })
    if (!requester?.teamId) {
      res.status(400).json({ error: 'You are not in a team' })
      return
    }

    const team = await prisma.team.findUnique({ where: { id: requester.teamId } })
    if (!team) {
      res.status(404).json({ error: 'Team not found' })
      return
    }

    if (team.leaderId !== requesterId) {
      res.status(403).json({ error: 'Only the team leader can kick members' })
      return
    }

    if (memberId === team.leaderId) {
      res.status(400).json({ error: 'Leader cannot be kicked' })
      return
    }

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: memberId } }
    })

    if (!membership) {
      res.status(404).json({ error: 'Member not in your team' })
      return
    }

    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: team.id, userId: memberId } } })
    await prisma.user.update({ where: { id: memberId }, data: { teamId: null } })

    res.json({ kicked: true })
  } catch (error) {
    console.error('Kick member error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}