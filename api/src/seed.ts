import prisma from './lib/prisma'

async function seed() {
  try {
    // Create sample competition
    const competition = await prisma.competition.create({
      data: {
        name: 'CTF Competition 2024',
        description: 'Annual cybersecurity competition featuring various challenge categories',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        competitionType: 'mixed',
        isPublic: true
      }
    })

    // Create sample challenges
    const challenges = await prisma.challenge.createMany({
      data: [
        {
          title: 'Web Basics',
          description: 'Find the flag in this simple web application. Look for common web vulnerabilities.',
          category: 'web',
          difficulty: 'easy',
          points: 100,
          flag: 'CTF{w3b_b4s1cs_123}',
          competitionId: competition.id,
          isVisible: true
        },
        {
          title: 'Crypto Starter',
          description: 'Decrypt this simple Caesar cipher. The shift is between 1 and 25.',
          category: 'crypto',
          difficulty: 'easy',
          points: 150,
          flag: 'CTF{c4es4r_w4s_h3re}',
          competitionId: competition.id,
          isVisible: true
        },
        {
          title: 'Reverse Engineering',
          description: 'Analyze this binary and find the hidden flag. Use tools like Ghidra or IDA.',
          category: 'reverse',
          difficulty: 'medium',
          points: 300,
          flag: 'CTF{r3v3rs3_3ng1n33r}',
          competitionId: competition.id,
          isVisible: true
        },
        {
          title: 'Forensics File',
          description: 'Find the hidden flag in this forensics challenge. Check file metadata and contents.',
          category: 'forensics',
          difficulty: 'medium',
          points: 250,
          flag: 'CTF{f0r3ns1cs_r0cks}',
          competitionId: competition.id,
          isVisible: true
        },
        {
          title: 'Pwn Basics',
          description: 'Exploit this binary to get the flag. Buffer overflow vulnerability present.',
          category: 'pwn',
          difficulty: 'hard',
          points: 400,
          flag: 'CTF{pwn_b4bypwn}',
          competitionId: competition.id,
          isVisible: true
        },
        {
          title: 'Steganography',
          description: 'Find the hidden message in this image. Use steganography tools.',
          category: 'stego',
          difficulty: 'medium',
          points: 200,
          flag: 'CTF{st3g0_h1dd3n}',
          competitionId: competition.id,
          isVisible: true
        }
      ]
    })

    console.log('Database seeded successfully!')
    console.log(`Created competition: ${competition.name}`)
    console.log('Created 6 sample challenges across different categories')

    // Admin user creation is managed by a separate script using environment variables
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seed()