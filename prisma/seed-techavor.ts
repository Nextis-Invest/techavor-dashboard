import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  datasources: { db: { url: "postgres://postgres:DhPiTsMj5ei38536VNb8DWkHnjGNqawCVooT33vnrRxwzueRRSpOJFZ7UxABgDLN@84.247.171.40:5464/postgres" } }
})

async function main() {
  console.log("🌱 Seeding Techavor products...")

  // ── Category ──────────────────────────────────────────
  const category = await prisma.category.upsert({
    where: { slug: "services-web" },
    update: {},
    create: {
      name: "Services Web",
      slug: "services-web",
      description: "Création et référencement de sites web professionnels",
      isActive: true,
      position: 0,
    }
  })
  console.log("✅ Category:", category.name)

  // ── Products ───────────────────────────────────────────
  const vitrine = await prisma.product.upsert({
    where: { slug: "site-vitrine" },
    update: {
      status: "ACTIVE",
      stripePriceId: "price_1T3GLeFEnXgU9ZoVh1FrSjrY",
    },
    create: {
      sku: "TCH-VITRINE-001",
      name: "Site Vitrine",
      slug: "site-vitrine",
      description: "Site vitrine professionnel livré en 48h. Design sur-mesure, mobile-first, SEO technique configuré dès le départ. La solution parfaite pour avoir une présence web qui convertit.",
      shortDescription: "Site professionnel livré en 48h",
      price: 500.00,
      compareAtPrice: 1200.00,
      taxable: true,
      taxRate: 20.0,
      status: "ACTIVE",
      featured: true,
      bestSeller: true,
      publishedAt: new Date(),
      metaTitle: "Création Site Vitrine Professionnel - 500€ HT | Techavor",
      metaDescription: "Site vitrine professionnel livré en 48h garanti. Design sur-mesure, SEO intégré. À partir de 500€ HT.",
      stripeProductId: "prod_vitrine",
      stripePriceId: "price_1T3GLeFEnXgU9ZoVh1FrSjrY",
      categoryId: category.id,
    }
  })
  console.log("✅ Product:", vitrine.name)

  const ecommerce = await prisma.product.upsert({
    where: { slug: "site-ecommerce" },
    update: {
      status: "ACTIVE",
      stripePriceId: "price_1T3GLeFEnXgU9ZoVGuyWvMQi",
    },
    create: {
      sku: "TCH-ECOM-001",
      name: "Site E-commerce",
      slug: "site-ecommerce",
      description: "Boutique e-commerce complète avec paiement Stripe, gestion des commandes, tableaux de bord analytics. Solution clé en main pour vendre en ligne dès le premier jour.",
      shortDescription: "Boutique e-commerce clé en main",
      price: 1390.00,
      compareAtPrice: 3000.00,
      taxable: true,
      taxRate: 20.0,
      status: "ACTIVE",
      featured: true,
      newArrival: false,
      publishedAt: new Date(),
      metaTitle: "Création Site E-commerce - 1 390€ HT | Techavor",
      metaDescription: "Boutique e-commerce professionnelle clé en main avec Stripe. Livraison garantie. À partir de 1 390€ HT.",
      stripeProductId: "prod_ecommerce",
      stripePriceId: "price_1T3GLeFEnXgU9ZoVGuyWvMQi",
      categoryId: category.id,
    }
  })
  console.log("✅ Product:", ecommerce.name)

  const seo = await prisma.product.upsert({
    where: { slug: "seo-mensuel" },
    update: {
      status: "ACTIVE",
      stripePriceId: "price_1T3GLfFEnXgU9ZoVxY4W6A2r",
    },
    create: {
      sku: "TCH-SEO-001",
      name: "SEO Mensuel",
      slug: "seo-mensuel",
      description: "Référencement naturel mensuel : audit technique, optimisation on-page, création de contenu SEO, suivi des positions. Remontez sur Google durablement.",
      shortDescription: "Référencement naturel mensuel",
      price: 100.00,
      compareAtPrice: 300.00,
      taxable: true,
      taxRate: 20.0,
      status: "ACTIVE",
      trending: true,
      publishedAt: new Date(),
      metaTitle: "SEO Mensuel - 100€ HT/mois | Techavor",
      metaDescription: "Service SEO mensuel : audit, optimisation, contenu. Remontez sur Google. À partir de 100€ HT/mois.",
      stripeProductId: "prod_seo",
      stripePriceId: "price_1T3GLfFEnXgU9ZoVxY4W6A2r",
      categoryId: category.id,
    }
  })
  console.log("✅ Product:", seo.name)

  // ── Upsells ────────────────────────────────────────────
  // Vitrine → E-commerce (UPSELL — montée en gamme)
  await prisma.productUpsell.upsert({
    where: { fromProductId_toProductId: { fromProductId: vitrine.id, toProductId: ecommerce.id } },
    update: {},
    create: {
      fromProductId: vitrine.id,
      toProductId: ecommerce.id,
      type: "UPSELL",
      priority: 1,
      discount: 10,
      message: "Passez à l'e-commerce et vendez directement en ligne — 10% de remise ce mois-ci",
      isActive: true,
    }
  })
  console.log("✅ Upsell: Vitrine → E-commerce")

  // Vitrine → SEO (CROSS_SELL)
  await prisma.productUpsell.upsert({
    where: { fromProductId_toProductId: { fromProductId: vitrine.id, toProductId: seo.id } },
    update: {},
    create: {
      fromProductId: vitrine.id,
      toProductId: seo.id,
      type: "CROSS_SELL",
      priority: 2,
      message: "Boostez la visibilité de votre site avec notre SEO mensuel dès 100€/mois",
      isActive: true,
    }
  })
  console.log("✅ Cross-sell: Vitrine → SEO")

  // E-commerce → SEO (CROSS_SELL)
  await prisma.productUpsell.upsert({
    where: { fromProductId_toProductId: { fromProductId: ecommerce.id, toProductId: seo.id } },
    update: {},
    create: {
      fromProductId: ecommerce.id,
      toProductId: seo.id,
      type: "CROSS_SELL",
      priority: 1,
      message: "Référencez votre boutique et multipliez vos ventes — SEO mensuel dès 100€/mois",
      isActive: true,
    }
  })
  console.log("✅ Cross-sell: E-commerce → SEO")

  // SEO → Vitrine (CROSS_SELL — si pas encore de site)
  await prisma.productUpsell.upsert({
    where: { fromProductId_toProductId: { fromProductId: seo.id, toProductId: vitrine.id } },
    update: {},
    create: {
      fromProductId: seo.id,
      toProductId: vitrine.id,
      type: "CROSS_SELL",
      priority: 1,
      message: "Pas encore de site ? On le crée en 48h pour 500€ HT — livraison garantie",
      isActive: true,
    }
  })
  console.log("✅ Cross-sell: SEO → Vitrine")

  // SEO → E-commerce (FREQUENTLY_BOUGHT)
  await prisma.productUpsell.upsert({
    where: { fromProductId_toProductId: { fromProductId: seo.id, toProductId: ecommerce.id } },
    update: {},
    create: {
      fromProductId: seo.id,
      toProductId: ecommerce.id,
      type: "FREQUENTLY_BOUGHT",
      priority: 2,
      message: "Boutique + SEO : la combinaison gagnante pour dominer votre niche",
      isActive: true,
    }
  })
  console.log("✅ Frequently bought: SEO → E-commerce")

  console.log("\n🎉 Techavor seed complete!")
  console.log("  3 products | 1 category | 5 upsell relations")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
