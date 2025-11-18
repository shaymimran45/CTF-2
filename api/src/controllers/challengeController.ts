import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthenticatedRequest } from '../lib/auth'
import path from 'path'
import fs from 'fs'

interface CreateChallengeBody {
  title: string
  description: string
  category: string
  difficulty?: string
  points: number | string
  flag: string
  competitionId?: string
  isVisible?: boolean | string
}

export const getChallenges = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, difficulty } = req.query

    const where: any = { isVisible: true }
    if (category) where.category = category
    if (difficulty) where.difficulty = difficulty

    const challenges = await prisma.challenge.findMany({
      where,
      include: {
        _count: {
          select: {
            solves: true
          }
        }
      },
      orderBy: [
        { points: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Get user's solved challenges
    const userSolves = req.user ? await prisma.solve.findMany({
      where: {
        userId: req.user.id
      },
      select: {
        challengeId: true
      }
    }) : []

    const solvedChallengeIds = userSolves.map(solve => solve.challengeId)

    const challengesWithStatus = challenges.map(challenge => ({
      ...challenge,
      solved: solvedChallengeIds.includes(challenge.id)
    }))

    res.json({ challenges: challengesWithStatus })
  } catch (error) {
    console.error('Get challenges error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const challenge = await prisma.challenge.findFirst({
      where: {
        id,
        isVisible: true
      },
      include: {
        files: {
          select: {
            id: true,
            filename: true,
            fileSize: true,
            uploadedAt: true
          }
        },
        hints: {
          select: {
            id: true,
            content: true,
            penalty: true
          }
        },
        _count: {
          select: {
            solves: true
          }
        }
      }
    })

    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }

    // Check if user has solved this challenge
    const userSolved = req.user ? await prisma.solve.findFirst({
      where: {
        userId: req.user.id,
        challengeId: id
      }
    }) : null

    res.json({
      ...challenge,
      solved: !!userSolved
    })
  } catch (error) {
    console.error('Get challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const submitFlag = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { flag } = req.body
    const userId = req.user!.id

    if (!flag) {
      res.status(400).json({ error: 'Flag is required' })
      return
    }

    // Get challenge
    const challenge = await prisma.challenge.findFirst({
      where: {
        id,
        isVisible: true
      }
    })

    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }

    // Check if user already solved this challenge
    const existingSolve = await prisma.solve.findFirst({
      where: {
        userId,
        challengeId: id
      }
    })

    if (existingSolve) {
      res.status(400).json({ error: 'Challenge already solved' })
      return
    }

    // Check flag
    const isCorrect = challenge.flag === flag.trim()

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        userId,
        challengeId: id,
        submittedFlag: flag.trim(),
        isCorrect,
        pointsAwarded: isCorrect ? challenge.points : 0
      }
    })

    if (isCorrect) {
      // Create solve record
      await prisma.solve.create({
        data: {
          userId,
          challengeId: id,
          submissionId: submission.id,
          pointsAwarded: challenge.points
        }
      })

      res.json({
        correct: true,
        points: challenge.points,
        message: 'Congratulations! Challenge solved!'
      })
    } else {
      res.json({
        correct: false,
        points: 0,
        message: 'Incorrect flag, try again!'
      })
    }
  } catch (error) {
    console.error('Submit flag error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.challenge.findMany({
      where: { isVisible: true },
      select: {
        category: true
      },
      distinct: ['category']
    })

    const categoryList = categories.map(c => c.category)
    res.json({ categories: categoryList })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const {
      title,
      description,
      category,
      difficulty,
      points,
      flag,
      competitionId,
      isVisible
    } = req.body as CreateChallengeBody

    if (!title || !description || !category || !points || !flag) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    let compId = competitionId
    if (!compId) {
      const comp = await prisma.competition.findFirst({ orderBy: { startTime: 'desc' } })
      if (!comp) {
        const created = await prisma.competition.create({
          data: {
            name: 'Default Competition',
            description: 'Auto-created competition',
            startTime: new Date(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            competitionType: 'individual',
            isPublic: true
          }
        })
        compId = created.id
      } else {
        compId = comp.id
      }
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        category,
        difficulty: difficulty || 'medium',
        points: Number(points),
        flag,
        competitionId: compId,
        isVisible: typeof isVisible !== 'undefined' ? isVisible === 'true' || isVisible === true : true
      }
    })

    const files = (req as unknown as { files?: Express.Multer.File[] }).files
    if (files && files.length > 0) {
      const records = files.map((f) => ({
        challengeId: challenge.id,
        filename: f.originalname,
        filePath: path.relative(process.cwd(), f.path),
        fileSize: f.size
      }))
      if (records.length > 0) {
        await prisma.challengeFile.createMany({ data: records })
      }
    }

    const created = await prisma.challenge.findUnique({
      where: { id: challenge.id },
      include: {
        files: {
          select: { id: true, filename: true, fileSize: true, uploadedAt: true }
        }
      }
    })

    res.status(201).json({ challenge: created })
  } catch (error) {
    console.error('Create challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await prisma.challenge.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }
    await prisma.challenge.delete({ where: { id } })
    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteAllChallenges = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.challenge.deleteMany({})
    res.json({ deletedCount: result.count })
  } catch (error) {
    console.error('Delete all challenges error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}