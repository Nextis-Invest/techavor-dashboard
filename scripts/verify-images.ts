import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const images = await prisma.productImage.findMany({
        where: { productId: 'cmkfvm9sq0004it4c8azkbaoy' }
    });

    console.log(JSON.stringify(images, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
