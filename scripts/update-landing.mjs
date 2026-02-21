import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Updating Landing Page Products ===\n');

  // 1. Unfeatured all products except CEH-V13-ECC-VOUCHER
  const unfeatured = await prisma.product.updateMany({
    where: {
      sku: { not: 'CEH-V13-ECC-VOUCHER' },
      featured: true
    },
    data: { featured: false }
  });
  console.log('Unfeatured products:', unfeatured.count);

  // 2. Update ECC voucher: €950 is sale price (30% off)
  // Original price = 950 / 0.7 = 1357.14 → round to 1357
  const updated = await prisma.product.update({
    where: { sku: 'CEH-V13-ECC-VOUCHER' },
    data: {
      featured: true,
      price: 950,
      compareAtPrice: 1357  // Original price before 30% off
    }
  });
  console.log('Updated ECC voucher:', updated.name);
  console.log('  Price:', updated.price, '€ (30% off)');
  console.log('  Original:', updated.compareAtPrice, '€');

  // 3. Find and delete 70% coupons
  const coupons = await prisma.coupon.findMany({
    select: { id: true, code: true, discountPercent: true, isActive: true }
  });
  console.log('\nExisting coupons:');
  coupons.forEach(c => console.log('  -', c.code, '| discount:', c.discountPercent + '%', '| active:', c.isActive));

  // Delete coupons with 70% discount
  const deleted = await prisma.coupon.deleteMany({
    where: { discountPercent: 70 }
  });
  console.log('\nDeleted 70% coupons:', deleted.count);

  // Verify final state
  const featured = await prisma.product.findMany({
    where: { featured: true },
    select: { sku: true, name: true, price: true, compareAtPrice: true }
  });
  console.log('\n=== Final Featured Products ===');
  featured.forEach(p => console.log('  -', p.sku, '| €' + p.price, '(was €' + p.compareAtPrice + ')'));
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
