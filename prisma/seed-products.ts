import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MINIO_BASE_URL = 'https://minio-fkc8sw4skck48k0cgks8gkgw.144.91.100.255.sslip.io/nassima/products';

async function main() {
  console.log('🌱 Seeding products...');

  // Get the category
  const category = await prisma.category.findUnique({
    where: { slug: 'culottes-menstruelles' }
  });

  if (!category) {
    throw new Error('Category "culottes-menstruelles" not found. Please create it first.');
  }

  // ============================================
  // NASSIMA DAILY
  // ============================================
  const nassimaDailyExists = await prisma.product.findUnique({
    where: { slug: 'nassima-daily' }
  });

  if (!nassimaDailyExists) {
    console.log('Creating Nassima Daily...');

    await prisma.product.create({
      data: {
        sku: 'NASSIMA-DAILY-001',
        name: 'Nassima Daily',
        slug: 'nassima-daily',
        description: `Découvrez Nassima Daily, la culotte menstruelle parfaite pour ton quotidien.

## Ta complice de tous les jours

Nassima Daily, c'est cette amie fidèle qui ne te lâche jamais. Du réveil au coucher, elle t'accompagne en silence, sans jamais te trahir.

## Caractéristiques

- **Absorption 12h** : Une journée complète sans stress, du matin au soir
- **Coton bio certifié GOTS** : Douceur infinie pour ta zone intime
- **Design invisible** : Se porte sous tous tes vêtements, même les plus moulants
- **Fabrication marocaine** : Conçue avec amour à Casablanca
- **Coutures plates** : Zéro frottement, zéro irritation

## Pour qui ?

Nassima Daily est idéale pour :
- Les flux légers à moyens
- Le quotidien au bureau ou à la maison
- Les journées où tu veux oublier que tu as tes règles
- Celles qui découvrent les culottes menstruelles

## Composition

- **Partie extérieure** : Coton bio certifié GOTS (95%) + Élasthanne (5%)
- **Partie absorbante** : 4 couches de bambou ultra-absorbant
- **Partie imperméable** : Membrane PUL respirante et étanche
- **Entrejambe** : 100% coton bio, toucher seconde peau

## Entretien facile

1. Rince à l'eau froide après utilisation
2. Lave en machine à 30°C (pas d'adoucissant)
3. Sèche à l'air libre (pas de sèche-linge)
4. Prête à te protéger à nouveau !

## Garantie & Engagement

- Garantie 2 ans
- Livraison gratuite au Maroc
- Retour sous 30 jours si tu n'es pas satisfaite

*Nassima Daily, c'est l'assurance de vivre tes journées sans te soucier de rien.* ☀️`,
        shortDescription: 'Ta complice du quotidien. Absorption 12h, coton bio certifié, confort invisible sous tous tes vêtements.',
        price: 199,
        compareAtPrice: 249,
        costPrice: 90,
        taxable: true,
        taxRate: 20,
        weight: 70,
        weightUnit: 'g',
        status: 'ACTIVE',
        featured: true,
        trending: false,
        newArrival: false,
        bestSeller: true,
        publishedAt: new Date(),
        metaTitle: 'Nassima Daily - Culotte Menstruelle Quotidienne | Nassima.store',
        metaDescription: 'Culotte menstruelle pour le quotidien. Absorption 12h, coton bio, design invisible. La préférée des Marocaines. Livraison gratuite.',
        categoryId: category.id,
        images: {
          create: [
            {
              url: `${MINIO_BASE_URL}/nassima-daily/nassima-daily-front.png`,
              altText: 'Nassima Daily - Vue de face',
              position: 0,
              isPrimary: true,
            },
            {
              url: `${MINIO_BASE_URL}/nassima-daily/nassima-daily-back.png`,
              altText: 'Nassima Daily - Vue de dos',
              position: 1,
              isPrimary: false,
            },
            {
              url: `${MINIO_BASE_URL}/nassima-daily/nassima-daily-detail.png`,
              altText: 'Nassima Daily - Détail des couches absorbantes',
              position: 2,
              isPrimary: false,
            },
          ],
        },
        attributes: {
          create: [
            { name: 'absorption', value: '12h', displayName: 'Durée d\'absorption', position: 0 },
            { name: 'material', value: 'Coton bio GOTS', displayName: 'Matière principale', position: 1 },
            { name: 'flow', value: 'Léger à moyen', displayName: 'Type de flux', position: 2 },
            { name: 'origin', value: 'Maroc', displayName: 'Fabriqué au', position: 3 },
            { name: 'certification', value: 'GOTS, Oeko-Tex', displayName: 'Certifications', position: 4 },
          ],
        },
      },
    });
    console.log('✅ Nassima Daily created!');
  } else {
    console.log('ℹ️ Nassima Daily already exists, skipping...');
  }

  // ============================================
  // NASSIMA SPORT
  // ============================================
  const nassimaSportExists = await prisma.product.findUnique({
    where: { slug: 'nassima-sport' }
  });

  if (!nassimaSportExists) {
    console.log('Creating Nassima Sport...');

    await prisma.product.create({
      data: {
        sku: 'NASSIMA-SPORT-001',
        name: 'Nassima Sport',
        slug: 'nassima-sport',
        description: `Découvrez Nassima Sport, la culotte menstruelle qui bouge avec toi.

## Libère-toi, bouge comme tu veux !

Tu pensais devoir mettre ta vie en pause pendant tes règles ? Nassima Sport va te faire changer d'avis. Yoga, running, danse, natation... elle te suit partout sans jamais te lâcher.

## Caractéristiques

- **Technologie Anti-Fuites+** : Barrières latérales renforcées pour les mouvements intenses
- **Séchage ultra-rapide** : Tissu technique qui évacue l'humidité
- **Maintien optimal** : Coupe sportive qui reste en place
- **Respirabilité maximale** : Zones de ventilation stratégiques
- **Absorption 10h** : Assez pour ton entraînement et après

## Pour qui ?

Nassima Sport est faite pour toi si :
- Tu fais du sport régulièrement (ou occasionnellement!)
- Tu refuses de mettre ta vie en pause pendant tes règles
- Tu veux une protection qui suit tes mouvements
- Tu transpires et tu as besoin d'une culotte qui respire

## Idéale pour

🧘 **Yoga & Pilates** : La coupe ajustée permet toutes les postures
🏃 **Running & Cardio** : Les barrières anti-fuites te protègent même en sprint
💃 **Danse** : Flexibilité totale, zéro gêne
🏊 **Natation** : Oui, même à la piscine (mais rince-la après!)
🚴 **Cyclisme** : Confort optimal en selle

## Composition technique

- **Partie extérieure** : Polyamide recyclé (80%) + Élasthanne (20%)
- **Partie absorbante** : 3 couches + barrières latérales anti-fuites
- **Partie imperméable** : Membrane PUL sport haute performance
- **Ceinture** : Élastique large anti-roulement
- **Entrejambe** : Bambou antibactérien naturel

## Entretien

1. Rince immédiatement après le sport
2. Lave en machine à 30°C
3. Séchage rapide à l'air libre (1-2h)
4. Prête pour ta prochaine séance !

## Technologies exclusives

- **DryFit Zone** : Évacuation de l'humidité en continu
- **SecureGuard** : Barrières anti-fuites brevetées
- **FlexMove** : Élasticité 4 directions pour liberté totale

*Nassima Sport : Vas-y, donne tout. On gère le reste.* 💪`,
        shortDescription: 'Bouge libre pendant tes règles. Anti-fuites+, séchage rapide, maintien parfait pour tous tes sports.',
        price: 279,
        compareAtPrice: 329,
        costPrice: 130,
        taxable: true,
        taxRate: 20,
        weight: 85,
        weightUnit: 'g',
        status: 'ACTIVE',
        featured: true,
        trending: true,
        newArrival: false,
        bestSeller: false,
        publishedAt: new Date(),
        metaTitle: 'Nassima Sport - Culotte Menstruelle Sportive Anti-Fuites | Nassima.store',
        metaDescription: 'Culotte menstruelle sport avec technologie Anti-Fuites+. Idéale pour yoga, running, danse. Séchage rapide. Livraison gratuite au Maroc.',
        categoryId: category.id,
        images: {
          create: [
            {
              url: `${MINIO_BASE_URL}/nassima-sport/nassima-sport-front.png`,
              altText: 'Nassima Sport - Vue de face',
              position: 0,
              isPrimary: true,
            },
            {
              url: `${MINIO_BASE_URL}/nassima-sport/nassima-sport-back.png`,
              altText: 'Nassima Sport - Vue de dos',
              position: 1,
              isPrimary: false,
            },
            {
              url: `${MINIO_BASE_URL}/nassima-sport/nassima-sport-action.png`,
              altText: 'Nassima Sport - En action',
              position: 2,
              isPrimary: false,
            },
          ],
        },
        attributes: {
          create: [
            { name: 'absorption', value: '10h', displayName: 'Durée d\'absorption', position: 0 },
            { name: 'technology', value: 'Anti-Fuites+', displayName: 'Technologie', position: 1 },
            { name: 'material', value: 'Polyamide recyclé', displayName: 'Matière principale', position: 2 },
            { name: 'flow', value: 'Moyen à abondant', displayName: 'Type de flux', position: 3 },
            { name: 'activity', value: 'Sport & activités intenses', displayName: 'Usage recommandé', position: 4 },
            { name: 'origin', value: 'Maroc', displayName: 'Fabriqué au', position: 5 },
          ],
        },
      },
    });
    console.log('✅ Nassima Sport created!');
  } else {
    console.log('ℹ️ Nassima Sport already exists, skipping...');
  }

  // ============================================
  // NASSIMA DENTELLE
  // ============================================
  const nassimaDentelleExists = await prisma.product.findUnique({
    where: { slug: 'nassima-dentelle' }
  });

  if (!nassimaDentelleExists) {
    console.log('Creating Nassima Dentelle...');

    await prisma.product.create({
      data: {
        sku: 'NASSIMA-DENTELLE-001',
        name: 'Nassima Dentelle',
        slug: 'nassima-dentelle',
        description: `Découvrez Nassima Dentelle, la culotte menstruelle qui te fait te sentir belle.

## Parce que tu mérites le luxe, même pendant tes règles

Qui a dit qu'on devait se négliger pendant nos règles ? Nassima Dentelle prouve que protection rime avec élégance. Une dentelle délicate qui cache une technologie de pointe.

## Caractéristiques

- **Dentelle française délicate** : Raffinement et féminité au quotidien
- **Absorption 12h** : Protection maximale dans un écrin de beauté
- **Coton bio certifié GOTS** : Douceur absolue pour ta zone intime
- **Coutures invisibles** : Élégance sous tous tes vêtements
- **Design romantique** : Pour te sentir belle, tous les jours du mois

## Pour qui ?

Nassima Dentelle est parfaite pour :
- Celles qui veulent se sentir belles pendant leurs règles
- Les moments où tu veux te faire plaisir
- Celles qui refusent de choisir entre protection et style
- Un cadeau pour toi-même ou une amie 💕

## L'alliance parfaite

Imagine : la délicatesse de la dentelle française, la douceur du coton bio, et une protection à toute épreuve. Nassima Dentelle, c'est tout ça à la fois.

## Composition luxueuse

- **Partie extérieure** : Dentelle française (90%) + Élasthanne (10%)
- **Partie absorbante** : 4 couches de bambou ultra-absorbant
- **Partie imperméable** : Membrane PUL invisible et respirante
- **Entrejambe** : 100% coton bio, toucher seconde peau
- **Finitions** : Élastiques doux, coutures plates

## Entretien délicat

1. Rince délicatement à l'eau froide
2. Place dans un filet de lavage
3. Lave en machine à 30°C (cycle délicat)
4. Sèche à plat pour préserver la dentelle

## Collection disponible

- Noir classique
- Rose poudré
- Bordeaux passion

*Nassima Dentelle : Parce que tes règles ne devraient jamais t'empêcher de te sentir belle.* ✨`,
        shortDescription: 'Élégance et protection réunies. Dentelle française délicate, absorption 12h, pour te sentir belle même pendant tes règles.',
        price: 249,
        compareAtPrice: 299,
        costPrice: 110,
        taxable: true,
        taxRate: 20,
        weight: 75,
        weightUnit: 'g',
        status: 'ACTIVE',
        featured: true,
        trending: false,
        newArrival: true,
        bestSeller: false,
        publishedAt: new Date(),
        metaTitle: 'Nassima Dentelle - Culotte Menstruelle en Dentelle | Nassima.store',
        metaDescription: 'Culotte menstruelle en dentelle française. Élégance et protection 12h. Coton bio, confort absolu. Livraison gratuite au Maroc.',
        categoryId: category.id,
        images: {
          create: [
            {
              url: `${MINIO_BASE_URL}/nassima-dentelle/nassima-dentelle-front.png`,
              altText: 'Nassima Dentelle - Vue de face',
              position: 0,
              isPrimary: true,
            },
            {
              url: `${MINIO_BASE_URL}/nassima-dentelle/nassima-dentelle-back.png`,
              altText: 'Nassima Dentelle - Vue de dos',
              position: 1,
              isPrimary: false,
            },
            {
              url: `${MINIO_BASE_URL}/nassima-dentelle/nassima-dentelle-detail.png`,
              altText: 'Nassima Dentelle - Détail de la dentelle',
              position: 2,
              isPrimary: false,
            },
          ],
        },
        attributes: {
          create: [
            { name: 'absorption', value: '12h', displayName: 'Durée d\'absorption', position: 0 },
            { name: 'material', value: 'Dentelle française + Coton bio', displayName: 'Matière principale', position: 1 },
            { name: 'flow', value: 'Léger à moyen', displayName: 'Type de flux', position: 2 },
            { name: 'style', value: 'Romantique', displayName: 'Style', position: 3 },
            { name: 'origin', value: 'Maroc', displayName: 'Fabriqué au', position: 4 },
            { name: 'certification', value: 'GOTS, Oeko-Tex', displayName: 'Certifications', position: 5 },
          ],
        },
      },
    });
    console.log('✅ Nassima Dentelle created!');
  } else {
    console.log('ℹ️ Nassima Dentelle already exists, skipping...');
  }

  console.log('🎉 Products seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
