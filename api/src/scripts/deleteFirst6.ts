import prisma from '../lib/prisma'

async function main() {
  const before = await prisma.challenge.count()
  const toDelete = await prisma.challenge.findMany({
    orderBy: { createdAt: 'asc' },
    take: 6,
    select: { id: true, title: true }
  })
  if (toDelete.length === 0) {
    console.log('No challenges to delete')
    return
  }
  const ids = toDelete.map(c => c.id)
  const del = await prisma.challenge.deleteMany({ where: { id: { in: ids } } })
  const after = await prisma.challenge.count()
  console.log(`Deleted ${del.count} challenges: ${toDelete.map(c => c.title).join(', ')}`)
  console.log(`Count before: ${before}, after: ${after}`)
}

main().finally(() => prisma.$disconnect())