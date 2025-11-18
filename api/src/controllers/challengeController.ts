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

interface CreateCompetitionBody {
  name: string
  description?: string
  startTime: string
  endTime: string
  competitionType?: string
  isPublic?: boolean | string
  challengeIds?: string[]
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

    if (challenge.maxAttempts && challenge.maxAttempts > 0) {
      const incorrectAttempts = await prisma.submission.count({
        where: { userId, challengeId: id, isCorrect: false }
      })
      if (incorrectAttempts >= challenge.maxAttempts) {
        res.status(429).json({ error: 'Max attempts reached' })
        return
      }
    }

    // Dynamic flag format support
    const allowedPrefixes = (process.env.FLAG_PREFIXES || 'CTF,flag')
      .split(',')
      .map(s => s.trim())

    const parseFlag = (f: string) => {
      const m = f.match(/^([A-Za-z0-9_]+)\{(.+)\}$/)
      if (!m) return { raw: f.trim(), prefix: null as string | null, value: null as string | null }
      return { raw: f.trim(), prefix: m[1], value: m[2] }
    }

    const submitted = parseFlag(flag.trim())
    const correct = parseFlag(challenge.flag)

    let isCorrect = false
    if (correct.value !== null) {
      // If challenge flag has a prefix format, allow any allowed prefix, but value must match
      const prefixOk = submitted.prefix !== null && (
        submitted.prefix === correct.prefix || allowedPrefixes.includes(submitted.prefix)
      )
      isCorrect = prefixOk && submitted.value === correct.value
    } else {
      isCorrect = challenge.flag === flag.trim()
    }

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

export const downloadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const file = await prisma.challengeFile.findUnique({ where: { id } })
    if (!file) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: file.challengeId } })
    if (!challenge || !challenge.isVisible) {
      res.status(403).json({ error: 'File not accessible' })
      return
    }

    const absolutePath = path.isAbsolute(file.filePath)
      ? file.filePath
      : path.join(process.cwd(), file.filePath)

    if (!absolutePath || !fs.existsSync(absolutePath)) {
      res.status(404).json({ error: 'File not found on server' })
      return
    }
    const stat = fs.statSync(absolutePath)
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`)
    fs.createReadStream(absolutePath).pipe(res)
  } catch (error) {
    console.error('Download file error:', error)
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

export const getAllChallengesAdmin = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        _count: { select: { solves: true } },
        files: { select: { id: true, filename: true, fileSize: true, uploadedAt: true } },
        hints: { select: { id: true, content: true, penalty: true, createdAt: true } }
      },
      orderBy: [{ createdAt: 'desc' }]
    })
    res.json({ challenges })
  } catch (error) {
    console.error('Get all challenges admin error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { title, description, category, difficulty, points, flag, isVisible } = req.body
    const existing = await prisma.challenge.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }
    const updated = await prisma.challenge.update({
      where: { id },
      data: {
        title: typeof title === 'string' ? title : existing.title,
        description: typeof description === 'string' ? description : existing.description,
        category: typeof category === 'string' ? category : existing.category,
        difficulty: typeof difficulty === 'string' ? difficulty : existing.difficulty,
        points: typeof points !== 'undefined' ? Number(points) : existing.points,
        flag: typeof flag === 'string' ? flag : existing.flag,
        isVisible: typeof isVisible !== 'undefined' ? (isVisible === 'true' || isVisible === true) : existing.isVisible
      }
    })
    res.json({ challenge: updated })
  } catch (error) {
    console.error('Update challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const toggleVisibility = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await prisma.challenge.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }
    const updated = await prisma.challenge.update({
      where: { id },
      data: { isVisible: !existing.isVisible }
    })
    res.json({ challenge: updated })
  } catch (error) {
    console.error('Toggle visibility error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const setAllVisibility = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { isVisible } = req.body as { isVisible: boolean }
    if (typeof isVisible === 'undefined') {
      res.status(400).json({ error: 'isVisible required' })
      return
    }
    const result = await prisma.challenge.updateMany({ data: { isVisible: !!isVisible } })
    res.json({ updatedCount: result.count })
  } catch (error) {
    console.error('Set all visibility error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const addHint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { content, penalty } = req.body as { content: string; penalty?: number | string }
    if (!content) {
      res.status(400).json({ error: 'Content required' })
      return
    }
    const challenge = await prisma.challenge.findUnique({ where: { id } })
    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }
    const hint = await prisma.hint.create({
      data: {
        challengeId: id,
        content,
        penalty: typeof penalty !== 'undefined' ? Number(penalty) : 0
      }
    })
    res.status(201).json({ hint })
  } catch (error) {
    console.error('Add hint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateHint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hintId } = req.params
    const { content, penalty } = req.body as { content?: string; penalty?: number | string }
    const existing = await prisma.hint.findUnique({ where: { id: hintId } })
    if (!existing) {
      res.status(404).json({ error: 'Hint not found' })
      return
    }
    const updated = await prisma.hint.update({
      where: { id: hintId },
      data: {
        content: typeof content === 'string' ? content : existing.content,
        penalty: typeof penalty !== 'undefined' ? Number(penalty) : existing.penalty
      }
    })
    res.json({ hint: updated })
  } catch (error) {
    console.error('Update hint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteHint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hintId } = req.params
    const existing = await prisma.hint.findUnique({ where: { id: hintId } })
    if (!existing) {
      res.status(404).json({ error: 'Hint not found' })
      return
    }
    await prisma.hint.delete({ where: { id: hintId } })
    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete hint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const addFilesToChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const challenge = await prisma.challenge.findUnique({ where: { id } })
    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found' })
      return
    }
    const files = (req as unknown as { files?: Express.Multer.File[] }).files || []
    if (files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' })
      return
    }
    const records = files.map((f) => ({
      challengeId: id,
      filename: f.originalname,
      filePath: path.relative(process.cwd(), f.path),
      fileSize: f.size
    }))
    await prisma.challengeFile.createMany({ data: records })
    const created = await prisma.challenge.findUnique({
      where: { id },
      include: { files: { select: { id: true, filename: true, fileSize: true, uploadedAt: true } } }
    })
    res.status(201).json({ challenge: created })
  } catch (error) {
    console.error('Add files to challenge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteChallengeFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params
    const file = await prisma.challengeFile.findUnique({ where: { id: fileId } })
    if (!file) {
      res.status(404).json({ error: 'File not found' })
      return
    }
    const abs = path.isAbsolute(file.filePath) ? file.filePath : path.join(process.cwd(), file.filePath)
    if (fs.existsSync(abs)) {
      try { fs.unlinkSync(abs) } catch {}
    }
    await prisma.challengeFile.delete({ where: { id: fileId } })
    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete challenge file error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createCompetition = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, startTime, endTime, competitionType, isPublic, challengeIds } = req.body as CreateCompetitionBody

    if (!name || !startTime || !endTime) {
      res.status(400).json({ error: 'Name, startTime, and endTime are required' })
      return
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid startTime or endTime' })
      return
    }
    if (end <= start) {
      res.status(400).json({ error: 'endTime must be after startTime' })
      return
    }

    const competition = await prisma.competition.create({
      data: {
        name,
        description: description || null,
        startTime: start,
        endTime: end,
        competitionType: competitionType || 'individual',
        isPublic: typeof isPublic !== 'undefined' ? (isPublic === 'true' || isPublic === true) : true
      }
    })

    if (Array.isArray(challengeIds) && challengeIds.length > 0) {
      await prisma.challenge.updateMany({
        where: { id: { in: challengeIds } },
        data: { competitionId: competition.id }
      })
    }

    const created = await prisma.competition.findUnique({ where: { id: competition.id } })
    res.status(201).json({ competition: created })
  } catch (error) {
    console.error('Create competition error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}