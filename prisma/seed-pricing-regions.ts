import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_REGIONS = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    countries: ['US'],
    isDefault: false,
    sortOrder: 1,
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    countries: ['GB'],
    isDefault: false,
    sortOrder: 2,
  },
  {
    code: 'EU',
    name: 'Europe',
    currency: 'EUR',
    countries: [
      'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI',
      'SE', 'DK', 'PL', 'CZ', 'GR', 'HU', 'RO', 'BG', 'HR', 'SK',
      'SI', 'EE', 'LV', 'LT', 'LU', 'MT', 'CY'
    ],
    isDefault: false,
    sortOrder: 3,
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    countries: ['CA'],
    isDefault: false,
    sortOrder: 4,
  },
  {
    code: 'AU',
    name: 'Australia & New Zealand',
    currency: 'AUD',
    countries: ['AU', 'NZ'],
    isDefault: false,
    sortOrder: 5,
  },
  {
    code: 'CH',
    name: 'Switzerland & Liechtenstein',
    currency: 'CHF',
    countries: ['CH', 'LI'],
    isDefault: false,
    sortOrder: 6,
  },
  {
    code: 'ROW',
    name: 'Rest of World',
    currency: 'USD',
    countries: [], // Empty means all other countries
    isDefault: true,
    sortOrder: 99,
  },
];

async function main() {
  console.log('🌍 Seeding pricing regions...');

  for (const region of DEFAULT_REGIONS) {
    const existingRegion = await prisma.pricingRegion.findUnique({
      where: { code: region.code },
    });

    if (!existingRegion) {
      await prisma.pricingRegion.create({
        data: region,
      });
      console.log(`  ✓ Created region: ${region.name} (${region.code})`);
    } else {
      console.log(`  - Region already exists: ${region.name} (${region.code})`);
    }
  }

  console.log('✅ Pricing regions seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
