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

// Product catalog
const products = [
  // === MAIN PRODUCTS (5) ===
  {
    sku: 'CEH-V13-ECC-VOUCHER',
    name: 'CEH v13 Exam Voucher - ECC Remote Proctored',
    slug: 'ceh-v13-exam-voucher-ecc-remote',
    price: 950,
    compareAtPrice: 1199,
    shortDescription: 'Official EC-Council CEH v13 exam voucher for remote proctored testing. Take the exam from anywhere.',
    description: `## CEH v13 Exam Voucher - ECC Remote Proctored

Take your Certified Ethical Hacker v13 exam from the comfort of your home or office with this official EC-Council remote proctored exam voucher.

### What's Included
- **Official CEH v13 Exam Voucher** - Valid for 12 months
- **Remote Proctoring** - Take the exam anywhere with a stable internet connection
- **Flexible Scheduling** - Book your exam at a time that suits you
- **Instant Delivery** - Receive your voucher code via email within 24 hours

### Exam Details
- **Duration:** 4 hours
- **Questions:** 125 multiple choice
- **Passing Score:** 70%
- **Format:** Remote proctored via ECC Exam Portal

### Requirements
- Stable internet connection (minimum 1 Mbps)
- Webcam and microphone
- Valid government-issued ID
- Quiet, private testing environment

*Perfect for self-study candidates who prefer flexible testing options.*`,
    featured: true,
    trending: true,
    category: 'exam-vouchers',
  },
  {
    sku: 'CEH-V13-PEARSON-VOUCHER',
    name: 'CEH v13 Exam Voucher - Pearson VUE Test Center',
    slug: 'ceh-v13-exam-voucher-pearson-vue',
    price: 1199,
    compareAtPrice: 1399,
    shortDescription: 'Official CEH v13 exam voucher for Pearson VUE test centers worldwide. Professional testing environment.',
    description: `## CEH v13 Exam Voucher - Pearson VUE Test Center

Take your Certified Ethical Hacker v13 exam at any authorized Pearson VUE testing center worldwide with this official exam voucher.

### What's Included
- **Official CEH v13 Exam Voucher** - Valid for 12 months
- **Pearson VUE Access** - 5,000+ test centers in 180 countries
- **Professional Environment** - Dedicated testing facilities
- **Instant Delivery** - Receive your voucher code via email within 24 hours

### Exam Details
- **Duration:** 4 hours
- **Questions:** 125 multiple choice
- **Passing Score:** 70%
- **Format:** Computer-based at Pearson VUE center

### Why Choose Test Center?
- Professional, distraction-free environment
- On-site technical support
- No home setup requirements
- Ideal for candidates without quiet home space

*Recommended for candidates who prefer a structured testing environment.*`,
    featured: true,
    category: 'exam-vouchers',
  },
  {
    sku: 'CEH-V13-VOUCHER-EBOOK-BUNDLE',
    name: 'CEH v13 Voucher + Official eBook Bundle',
    slug: 'ceh-v13-voucher-ebook-bundle',
    price: 1500,
    compareAtPrice: 1799,
    shortDescription: 'Complete self-study package: CEH v13 exam voucher + official EC-Council courseware (4 volumes).',
    description: `## CEH v13 Voucher + Official eBook Bundle

The complete self-study package for CEH v13 certification. Includes the official exam voucher and all 4 volumes of EC-Council courseware.

### What's Included
- **CEH v13 Exam Voucher (ECC Remote)** - Valid for 12 months
- **Official EC-Council eBooks (Vol 1-4)** - 2,000+ pages of content
- **Digital Access** - Read on any device
- **Instant Delivery** - Immediate access to materials

### eBook Contents
1. **Volume 1:** Introduction to Ethical Hacking, Footprinting, Scanning
2. **Volume 2:** Enumeration, Vulnerability Analysis, System Hacking
3. **Volume 3:** Malware, Sniffing, Social Engineering, DoS
4. **Volume 4:** Web Hacking, Wireless, Mobile, IoT, Cloud, Cryptography

### Study Features
- Searchable PDF format
- Chapter summaries and key points
- Exam objectives mapping
- Practice questions per chapter

*Best value for self-disciplined learners who prefer reading-based study.*`,
    featured: true,
    bestSeller: true,
    category: 'bundles',
  },
  {
    sku: 'CEH-V13-VOUCHER-COURSE-BUNDLE',
    name: 'CEH v13 Voucher + Online Course Bundle',
    slug: 'ceh-v13-voucher-course-bundle',
    price: 1800,
    compareAtPrice: 2199,
    shortDescription: 'Exam voucher + video course + practice labs. Perfect starter bundle for CEH v13 certification.',
    description: `## CEH v13 Voucher + Online Course Bundle

Everything you need to pass CEH v13 on your first attempt. Combines the exam voucher with comprehensive video training and hands-on labs.

### What's Included
- **CEH v13 Exam Voucher (ECC Remote)** - Valid for 12 months
- **Video Course** - 40+ hours of expert instruction
- **Practice Labs** - Hands-on hacking exercises
- **6 Months Access** - Unlimited course replay
- **Instant Delivery** - Start learning immediately

### Course Curriculum
- All 20 CEH v13 domains covered
- Real-world hacking demonstrations
- Tool tutorials (Nmap, Metasploit, Burp Suite, etc.)
- Exam tips and strategies

### Lab Environment
- Cloud-based virtual labs
- Pre-configured attack/target machines
- No setup required
- Practice real exploits safely

*Ideal for beginners or those who learn best through video and hands-on practice.*`,
    featured: true,
    newArrival: true,
    category: 'bundles',
  },
  {
    sku: 'CEH-V13-RETAKE-VOUCHER',
    name: 'CEH v13 Retake Exam Voucher',
    slug: 'ceh-v13-retake-voucher',
    price: 500,
    compareAtPrice: 699,
    shortDescription: 'Second chance voucher for CEH v13 exam. Valid if you failed your first attempt.',
    description: `## CEH v13 Retake Exam Voucher

Don't let one failed attempt stop your certification journey. Get back on track with this discounted retake voucher.

### What's Included
- **CEH v13 Retake Voucher** - Valid for 12 months
- **ECC Remote Proctoring** - Same flexible testing format
- **Instant Delivery** - Receive within 24 hours

### Eligibility
- Must have failed CEH v13 exam previously
- Proof of failed attempt required (score report)
- Can only be used for second attempt

### Retake Policy
- Wait 14 days after first failed attempt
- Review weak areas using your score report
- No limit on study time before retake

### Success Tips
- Focus on domains where you scored lowest
- Use practice exams to identify gaps
- Consider adding study materials

*20-30% of candidates need a retake - you're not alone. Come back stronger!*`,
    category: 'exam-vouchers',
  },

  // === UPSELLS & PREMIUM (3) ===
  {
    sku: 'CEH-V13-PREMIUM-BUNDLE',
    name: 'CEH v13 Premium Training Bundle',
    slug: 'ceh-v13-premium-training-bundle',
    price: 2500,
    compareAtPrice: 3199,
    shortDescription: 'Ultimate CEH v13 package: Exam voucher + full course + AI-powered labs + 1-on-1 mentoring.',
    description: `## CEH v13 Premium Training Bundle

The ultimate CEH v13 certification package. Everything you need plus premium features for guaranteed success.

### What's Included
- **CEH v13 Exam Voucher (ECC Remote)** - Valid for 12 months
- **Complete Video Course** - 60+ hours of content
- **AI-Powered Labs** - Advanced hands-on training
- **1-on-1 Mentoring** - 2 hours with certified instructor
- **Practice Exams** - 500+ questions with explanations
- **12 Months Access** - Extended learning period
- **Exam Pass Guarantee** - Free retake if you fail

### Premium Lab Features
- AI-guided attack scenarios
- Real-world CTF challenges
- Automated skill assessment
- Personalized learning path

### Mentoring Sessions
- Review weak areas
- Exam strategy planning
- Career guidance
- Q&A with expert

*Our highest success rate package - 95% pass on first attempt!*`,
    featured: true,
    trending: true,
    category: 'bundles',
  },
  {
    sku: 'CEH-PRACTICAL-VOUCHER',
    name: 'CEH Practical Exam Voucher',
    slug: 'ceh-practical-exam-voucher',
    price: 600,
    compareAtPrice: 799,
    shortDescription: 'Hands-on practical exam voucher. Prove your real-world hacking skills with CEH Practical.',
    description: `## CEH Practical Exam Voucher

Take your CEH certification to the next level with the hands-on practical exam. Demonstrate real-world hacking skills.

### What's Included
- **CEH Practical Exam Voucher** - Valid for 12 months
- **6-Hour Practical Exam** - Real hacking challenges
- **iLabs Access** - Practice environment
- **Instant Delivery** - Receive within 24 hours

### Exam Format
- **Duration:** 6 hours
- **Challenges:** 20 practical scenarios
- **Passing Score:** 70% (14/20 challenges)
- **Environment:** Live virtual network

### Skills Tested
- Network scanning and enumeration
- Vulnerability identification
- System exploitation
- Web application attacks
- Password cracking
- Evidence collection

### Prerequisites
- CEH v13 certification recommended
- Hands-on hacking experience
- Familiarity with common tools

*Stand out from paper-certified candidates with proven practical skills!*`,
    category: 'exam-vouchers',
  },
  {
    sku: 'CEH-V13-PRACTICE-TESTS',
    name: 'CEH v13 Practice Tests & Cheat Sheets',
    slug: 'ceh-v13-practice-tests-cheat-sheets',
    price: 79,
    compareAtPrice: 149,
    shortDescription: 'Comprehensive practice exam pack: 500+ questions + study cheat sheets + exam tips.',
    description: `## CEH v13 Practice Tests & Cheat Sheets

Boost your exam readiness with our comprehensive practice test pack and quick-reference cheat sheets.

### What's Included
- **500+ Practice Questions** - Exam-style format
- **5 Full Mock Exams** - Timed practice tests
- **Detailed Explanations** - Learn from mistakes
- **Cheat Sheets** - Quick reference guides
- **Exam Tips PDF** - Strategies for success
- **Lifetime Access** - Unlimited practice

### Practice Test Features
- Questions mapped to exam objectives
- Difficulty matches real exam
- Performance tracking
- Weak area identification

### Cheat Sheet Topics
- Port numbers & protocols
- Common tools & commands
- Attack methodologies
- Cryptography formulas
- Network diagrams

### Study Strategy
1. Take diagnostic test
2. Review weak areas
3. Study cheat sheets
4. Retake practice exams
5. Score 85%+ consistently

*Perfect add-on to any voucher purchase or standalone exam prep!*`,
    newArrival: true,
    category: 'digital-products',
  },
];

// Categories to create
const categories = [
  { name: 'Exam Vouchers', slug: 'exam-vouchers', description: 'Official certification exam vouchers' },
  { name: 'Bundles', slug: 'bundles', description: 'Value bundles with courses and materials' },
  { name: 'Digital Products', slug: 'digital-products', description: 'Practice tests, cheat sheets, and study guides' },
];

async function createProducts() {
  console.log('=== Creating CEH v13 Product Catalog ===\n');

  // Create categories
  console.log('Creating categories...');
  const categoryMap = {};
  for (const cat of categories) {
    let category = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!category) {
      category = await prisma.category.create({ data: cat });
      console.log('  Created:', cat.name);
    } else {
      console.log('  Exists:', cat.name);
    }
    categoryMap[cat.slug] = category.id;
  }
  console.log('');

  // Create products
  console.log('Creating products...');
  let created = 0;
  let skipped = 0;

  for (const p of products) {
    // Check if exists
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      console.log('  Skipped (exists):', p.name);
      skipped++;
      continue;
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        status: 'ACTIVE',
        featured: p.featured || false,
        trending: p.trending || false,
        newArrival: p.newArrival || false,
        bestSeller: p.bestSeller || false,
        publishedAt: new Date(),
        categoryId: categoryMap[p.category],
        images: {
          create: [{
            url: `https://minio.techavor.me/public/products/${p.slug}.png`,
            altText: p.name,
            position: 0,
            isPrimary: true,
          }]
        },
      },
      include: { images: true },
    });

    console.log('  Created:', p.name);

    // Sync to Stripe
    try {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.shortDescription || undefined,
        metadata: {
          dashboard_id: product.id,
          sku: product.sku,
        },
        images: product.images.map(img => img.url).slice(0, 8),
      });

      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(Number(product.price) * 100),
        currency: 'eur',
        metadata: {
          dashboard_id: product.id,
          sku: product.sku,
        },
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
        },
      });

      console.log('    → Synced to Stripe:', stripeProduct.id);
    } catch (err) {
      console.log('    → Stripe sync failed:', err.message);
    }

    created++;
  }

  console.log('');
  console.log('=== Summary ===');
  console.log('Created:', created);
  console.log('Skipped:', skipped);
  console.log('Total products:', created + skipped);
}

createProducts()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
