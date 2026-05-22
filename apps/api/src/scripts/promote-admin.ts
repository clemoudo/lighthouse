import { prisma, UserRole } from "@repo/db"
import { logger } from "@repo/logger"

/**
 * Script to promote a user to admin role via their email.
 * Usage: node dist/scripts/promote-admin.js <email>
 */
async function promoteAdmin() {
  const email = process.argv[2]

  if (!email) {
    console.error("❌ Usage: pnpm promote-admin <email>")
    process.exit(1)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found.`)
      process.exit(1)
    }

    if (user.role === UserRole.admin) {
      console.log(`ℹ️ User ${email} is already an admin.`)
      process.exit(0)
    }

    await prisma.user.update({
      where: { email },
      data: { role: UserRole.admin },
    })

    console.log(`✅ User ${email} has been successfully promoted to ADMIN.`)
  } catch (error) {
    logger.error("Failed to promote user to admin", error)
    console.error("❌ An error occurred while promoting the user.")
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

promoteAdmin()
