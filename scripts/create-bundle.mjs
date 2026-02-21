import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { readFileSync } from 'fs';

// Parse .env file
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="([^"]*)"/);
  if (match) envVars[match[1]] = match[2];
});

const prisma = new PrismaClient();
const stripe = new Stripe(envVars['STRIPE_SECRET_KEY'], { apiVersion: '2024-12-18.acacia' });

async function main() {
  console.log('=== Creating CEH v13 Bundle Structure ===\n');

  // Get the bundles category
  let bundleCategory = await prisma.category.findUnique({ where: { slug: 'bundles' } });
  if (!bundleCategory) {
    bundleCategory = await prisma.category.create({
      data: { name: 'Bundles', slug: 'bundles', description: 'Value bundles with courses and materials' }
    });
  }

  // 1. Create the Labs/Course Access product (individual component)
  console.log('1. Creating individual components...');

  let labsProduct = await prisma.product.findUnique({ where: { sku: 'CEH-V13-LABS-ACCESS' } });
  if (!labsProduct) {
    labsProduct = await prisma.product.create({
      data: {
        sku: 'CEH-V13-LABS-ACCESS',
        name: 'CEH v13 Online Course + Practice Labs',
        slug: 'ceh-v13-online-course-labs',
        price: 999,
        compareAtPrice: 1299,
        shortDescription: '40+ hours video course + hands-on hacking labs. 6 months access.',
        description: `## CEH v13 Online Course + Practice Labs

Comprehensive video training with hands-on lab environment to master ethical hacking skills.

### What's Included
- **Video Course** - 40+ hours of expert instruction
- **Practice Labs** - Cloud-based virtual hacking environment
- **6 Months Access** - Unlimited course replay
- **Lab Scenarios** - Real-world attack/defense exercises

### Course Curriculum
- All 20 CEH v13 domains covered
- Real-world hacking demonstrations
- Tool tutorials (Nmap, Metasploit, Burp Suite, etc.)
- Exam tips and strategies

### Lab Environment
- Cloud-based virtual labs
- Pre-configured attack/target machines
- No setup required
- Practice real exploits safely`,
        status: 'ACTIVE',
        featured: false,
        categoryId: bundleCategory.id,
        publishedAt: new Date(),
      }
    });
    console.log('   Created: CEH v13 Online Course + Practice Labs (€999)');

    // Sync to Stripe
    const stripeProduct = await stripe.products.create({
      name: labsProduct.name,
      description: labsProduct.shortDescription,
      metadata: { dashboard_id: labsProduct.id, sku: labsProduct.sku },
    });
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: 99900,
      currency: 'eur',
    });
    await prisma.product.update({
      where: { id: labsProduct.id },
      data: { stripeProductId: stripeProduct.id, stripePriceId: stripePrice.id }
    });
    console.log('   → Synced to Stripe');
  } else {
    console.log('   Exists: CEH v13 Online Course + Practice Labs');
  }

  // 2. Get the exam voucher
  const voucherProduct = await prisma.product.findUnique({ where: { sku: 'CEH-V13-ECC-VOUCHER' } });
  if (!voucherProduct) {
    console.error('ERROR: Exam voucher product not found!');
    return;
  }
  console.log('   Found: CEH v13 Exam Voucher (€' + voucherProduct.price + ')');

  // 3. Update the existing bundle product
  console.log('\n2. Updating bundle product...');

  let bundleProduct = await prisma.product.findUnique({
    where: { sku: 'CEH-V13-VOUCHER-COURSE-BUNDLE' },
    include: { bundle: true }
  });

  if (bundleProduct) {
    // Update to be featured and set as main landing product
    bundleProduct = await prisma.product.update({
      where: { id: bundleProduct.id },
      data: {
        featured: true,
        price: 1800,
        compareAtPrice: 2298, // 950 + 999 + ~350 savings value
        shortDescription: 'Complete CEH v13 package: Exam voucher + 40h video course + hands-on labs. Save €498!',
      }
    });
    console.log('   Updated: ' + bundleProduct.name);
  }

  // 4. Create the bundle structure
  console.log('\n3. Creating bundle structure...');

  // Check if bundle already exists
  let bundle = await prisma.productBundle.findUnique({ where: { productId: bundleProduct.id } });

  if (!bundle) {
    // Individual prices: Voucher €950 + Labs €999 = €1949
    // Bundle price: €1800
    // Savings: €149
    bundle = await prisma.productBundle.create({
      data: {
        productId: bundleProduct.id,
        savingsAmount: 149,
        savingsPercent: 7.6, // ~7.6% savings
        items: {
          create: [
            {
              productId: voucherProduct.id,
              quantity: 1,
              individualPrice: 950,
              position: 0,
            },
            {
              productId: labsProduct.id,
              quantity: 1,
              individualPrice: 999,
              position: 1,
            }
          ]
        }
      },
      include: { items: { include: { product: true } } }
    });
    console.log('   Created bundle with ' + bundle.items.length + ' items');
    bundle.items.forEach(item => {
      console.log('     - ' + item.product.name + ' (€' + item.individualPrice + ')');
    });
  } else {
    console.log('   Bundle structure already exists');
  }

  // 5. Create upsell relationships
  console.log('\n4. Creating upsell relationships...');

  // Upsell from voucher to bundle
  const upsell1 = await prisma.productUpsell.upsert({
    where: {
      fromProductId_toProductId: {
        fromProductId: voucherProduct.id,
        toProductId: bundleProduct.id
      }
    },
    update: {},
    create: {
      fromProductId: voucherProduct.id,
      toProductId: bundleProduct.id,
      type: 'UPSELL',
      priority: 1,
      message: 'Upgrade to the complete bundle and save €149!',
      isActive: true,
    }
  });
  console.log('   Upsell: Voucher → Bundle');

  // Cross-sell from voucher to labs
  const upsell2 = await prisma.productUpsell.upsert({
    where: {
      fromProductId_toProductId: {
        fromProductId: voucherProduct.id,
        toProductId: labsProduct.id
      }
    },
    update: {},
    create: {
      fromProductId: voucherProduct.id,
      toProductId: labsProduct.id,
      type: 'CROSS_SELL',
      priority: 2,
      message: 'Add online course + labs to boost your preparation',
      isActive: true,
    }
  });
  console.log('   Cross-sell: Voucher → Labs');

  // Frequently bought together: Labs → Voucher
  const upsell3 = await prisma.productUpsell.upsert({
    where: {
      fromProductId_toProductId: {
        fromProductId: labsProduct.id,
        toProductId: voucherProduct.id
      }
    },
    update: {},
    create: {
      fromProductId: labsProduct.id,
      toProductId: voucherProduct.id,
      type: 'FREQUENTLY_BOUGHT',
      priority: 1,
      message: 'Complete your certification - add the exam voucher',
      isActive: true,
    }
  });
  console.log('   Frequently bought: Labs → Voucher');

  // 6. Update landing page
  console.log('\n5. Updating landing page featured product...');

  // Unfeatured all except bundle
  await prisma.product.updateMany({
    where: { sku: { not: 'CEH-V13-VOUCHER-COURSE-BUNDLE' } },
    data: { featured: false }
  });

  // Set bundle as featured with correct pricing
  await prisma.product.update({
    where: { sku: 'CEH-V13-VOUCHER-COURSE-BUNDLE' },
    data: {
      featured: true,
      price: 1800,
      compareAtPrice: 1949, // Individual total
    }
  });

  console.log('   Bundle is now the featured product on landing page');

  // Summary
  console.log('\n=== Summary ===');
  console.log('Bundle: CEH v13 Voucher + Course Bundle');
  console.log('Price: €1,800 (was €1,949 if bought separately)');
  console.log('Savings: €149 (7.6%)');
  console.log('');
  console.log('Bundle contains:');
  console.log('  1. CEH v13 Exam Voucher - €950');
  console.log('  2. CEH v13 Online Course + Labs - €999');
  console.log('');
  console.log('Upsells configured:');
  console.log('  • Voucher → Bundle (upgrade offer)');
  console.log('  • Voucher → Labs (cross-sell)');
  console.log('  • Labs → Voucher (frequently bought)');
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
