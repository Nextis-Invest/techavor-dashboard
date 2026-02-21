import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        take: 10,
        select: {
            id: true,
            name: true,
            description: true,
        },
    });

    fs.writeFileSync('products_list.json', JSON.stringify(products, null, 2));
    console.log(`Successfully fetched ${products.length} products`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
