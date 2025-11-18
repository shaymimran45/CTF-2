import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'

  const existing = await prisma.user.findFirst({ where: { email } })
  const passwordHash = await bcrypt.hash(password, 12)
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'admin', passwordHash, username }
    })
    console.log('Updated admin:', updated.email)
  } else {
    const user = await prisma.user.create({
      data: { email, username, passwordHash, role: 'admin' }
    })
    console.log('Created admin:', user.email)
  }
}

main().finally(() => prisma.$disconnect())