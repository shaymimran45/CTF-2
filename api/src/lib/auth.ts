import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Request, Response, NextFunction } from 'express'

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN ?? '7d'

export interface AuthUser {
  id: string
  email: string
  username: string
  role: string
  teamId?: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (user: AuthUser): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any }
  return jwt.sign(user as object, JWT_SECRET, options)
}

export const verifyToken = (token: string): AuthUser => {
  return jwt.verify(token, JWT_SECRET) as AuthUser
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  try {
    const user = verifyToken(token)
    req.user = user
    next()
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}