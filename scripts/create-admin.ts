import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const email = "nextis.invest@gmail.com"

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    // Update to admin if exists
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        emailVerified: new Date(),
      },
    })
    console.log(`✅ Updated existing user to ADMIN: ${updated.email}`)
  } else {
    // Create new admin user
    const user = await prisma.user.create({
      data: {
        email,
        name: "Nextis Admin",
        role: "ADMIN",
        emailVerified: new Date(),
      },
    })
    console.log(`✅ Created new ADMIN user: ${user.email}`)
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
