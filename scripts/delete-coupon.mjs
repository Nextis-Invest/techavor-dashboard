import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // List all coupons
  const coupons = await prisma.coupon.findMany({
    select: { id: true, code: true, type: true, value: true, isActive: true }
  });
  console.log('Existing coupons:');
  coupons.forEach(c => console.log('  - id:', c.id, '| code:', c.code, '| type:', c.type, '| value:', c.value, '| active:', c.isActive));

  // Delete coupons with 70% value (percentage type)
  const deleted = await prisma.coupon.deleteMany({
    where: { value: 70 }
  });
  console.log('\nDeleted coupons with value 70:', deleted.count);

  // Verify
  const remaining = await prisma.coupon.findMany({
    select: { code: true, value: true }
  });
  console.log('\nRemaining coupons:', remaining.length);
  remaining.forEach(c => console.log('  -', c.code, '| value:', c.value));
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
