import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical']

async function main() {
  for (const { username, email } of [
    { username: 'alice', email: 'alice@test.com' },
    { username: 'bob', email: 'bob@test.com' },
  ]) {
    const passwordHash = await bcrypt.hash('password123', 12)
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { username, email, passwordHash },
    })
    for (const category of CATEGORIES) {
      await prisma.userRating.upsert({
        where: { userId_category: { userId: user.id, category } },
        update: {},
        create: { userId: user.id, category },
      })
    }
  }
  console.log('Seeded 2 test users')
}

main().catch(console.error).finally(() => prisma.$disconnect())
