import express from 'express'
import { register, login, getProfile } from '../controllers/authController'
import { getChallenges, getChallenge, submitFlag, getCategories, createChallenge, deleteChallenge, deleteAllChallenges, downloadFile, getAllChallengesAdmin, updateChallenge, toggleVisibility, setAllVisibility } from '../controllers/challengeController'
import { getLeaderboard, getStatistics } from '../controllers/leaderboardController'
import { authenticateToken, requireRole } from '../lib/auth'
import multer from 'multer'
import fs from 'fs'

const router = express.Router()

const uploadDir = process.env.UPLOAD_DIR || 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${timestamp}-${safeName}`)
  }
})
const upload = multer({ storage })

// Auth routes
router.post('/auth/register', register)
router.post('/auth/login', login)
router.get('/auth/profile', authenticateToken, getProfile)

// Challenge routes
router.get('/challenges', authenticateToken, getChallenges)
router.get('/challenges/categories', getCategories)
router.get('/challenges/:id', authenticateToken, getChallenge)
router.post('/challenges/:id/submit', authenticateToken, submitFlag)

// Admin routes
router.post('/admin/challenges', authenticateToken, requireRole(['admin']), upload.array('files'), createChallenge)
router.delete('/admin/challenges/:id', authenticateToken, requireRole(['admin']), deleteChallenge)
router.delete('/admin/challenges', authenticateToken, requireRole(['admin']), deleteAllChallenges)
router.get('/admin/challenges', authenticateToken, requireRole(['admin']), getAllChallengesAdmin)
router.patch('/admin/challenges/:id', authenticateToken, requireRole(['admin']), updateChallenge)
router.post('/admin/challenges/:id/toggle-visibility', authenticateToken, requireRole(['admin']), toggleVisibility)
router.post('/admin/challenges/visibility', authenticateToken, requireRole(['admin']), setAllVisibility)

// File download
router.get('/files/:id', downloadFile)

// Leaderboard routes
router.get('/leaderboard', getLeaderboard)
router.get('/statistics', getStatistics)

export default router