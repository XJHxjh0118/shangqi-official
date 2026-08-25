import { PrismaClient } from '@prisma/client'
import { insertExtraProducts } from './seed-extra-products'

const prisma = new PrismaClient()

async function main() {
  const result = await insertExtraProducts(prisma)
  console.log(`extra products created=${result.created} skipped=${result.skipped}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
