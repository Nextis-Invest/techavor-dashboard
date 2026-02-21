import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get current featured products
  const featured = await prisma.product.findMany({
    where: { featured: true },
    select: { id: true, sku: true, name: true, price: true, compareAtPrice: true }
  });
  console.log('Current featured products:');
  featured.forEach(p => console.log('  -', p.sku, '| price:', p.price, '| compareAt:', p.compareAtPrice));

  // Get discount codes
  const codes = await prisma.discountCode.findMany({
    select: { id: true, code: true, discountPercent: true, discountAmount: true, isActive: true }
  });
  console.log('\nDiscount codes:');
  codes.forEach(c => console.log('  - id:', c.id, '| code:', c.code, '| percent:', c.discountPercent, '| active:', c.isActive));
}
main().finally(() => prisma.$disconnect());
