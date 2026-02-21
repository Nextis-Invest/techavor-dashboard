import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== Bundle Verification ===\n');

  // Get the featured product
  const featured = await prisma.product.findFirst({
    where: { featured: true },
    include: {
      bundle: {
        include: {
          items: {
            include: { product: { select: { name: true, sku: true, price: true } } },
            orderBy: { position: 'asc' }
          }
        }
      },
      upsellsFrom: {
        where: { isActive: true },
        include: { toProduct: { select: { name: true, sku: true, price: true } } }
      }
    }
  });

  console.log('Featured Product:', featured.name);
  console.log('SKU:', featured.sku);
  console.log('Price: €' + featured.price);
  console.log('Compare at: €' + featured.compareAtPrice);
  console.log('Stripe ID:', featured.stripeProductId);

  if (featured.bundle) {
    console.log('\n📦 Bundle Contents:');
    console.log('Savings: €' + featured.bundle.savingsAmount + ' (' + featured.bundle.savingsPercent + '%)');
    featured.bundle.items.forEach((item, i) => {
      console.log('  ' + (i + 1) + '. ' + item.product.name);
      console.log('     Individual price: €' + item.individualPrice);
    });
  }

  if (featured.upsellsFrom && featured.upsellsFrom.length > 0) {
    console.log('\n🎯 Upsells from this product:');
    featured.upsellsFrom.forEach(u => {
      console.log('  → ' + u.type + ': ' + u.toProduct.name + ' (€' + u.toProduct.price + ')');
      console.log('    Message: ' + u.message);
    });
  }

  // Check upsells TO this product (from other products)
  const upsellsTo = await prisma.productUpsell.findMany({
    where: { toProductId: featured.id, isActive: true },
    include: { fromProduct: { select: { name: true, sku: true, price: true } } }
  });

  if (upsellsTo.length > 0) {
    console.log('\n📈 Products that upsell TO this bundle:');
    upsellsTo.forEach(u => {
      console.log('  ← ' + u.type + ' from: ' + u.fromProduct.name + ' (€' + u.fromProduct.price + ')');
    });
  }

  // Summary of all products
  console.log('\n=== All Products ===');
  const allProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { sku: true, name: true, price: true, featured: true, stripeProductId: true },
    orderBy: { price: 'asc' }
  });

  allProducts.forEach(p => {
    const marker = p.featured ? '⭐' : '  ';
    const stripe = p.stripeProductId ? '✓' : '✗';
    console.log(marker + ' €' + String(p.price).padStart(4) + ' | ' + stripe + ' | ' + p.name);
  });
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
