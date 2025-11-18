import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { hashPassword, comparePassword, generateToken } from '../lib/auth'

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body

    if (!email || !username || !password) {
      res.status(400).json({ error: 'Email, username, and password are required' })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    })

    if (existingUser) {
      res.status(409).json({ error: 'User with this email or username already exists' })
      return
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        role: 'user'
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        teamId: true,
        createdAt: true
      }
    })

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      teamId: user.teamId || undefined
    })

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      teamId: user.teamId || undefined
    })

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        teamId: user.teamId,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        teamId: true,
        createdAt: true,
        _count: {
          select: {
            solves: true,
            submissions: true
          }
        }
      }
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}