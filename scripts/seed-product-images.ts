import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { uploadFile } from '../lib/minio';

const prisma = new PrismaClient();

async function main() {
    const imagesToSeed = [
        {
            productId: 'cmkfvm9sq0004it4c8azkbaoy', // CEH v13 Exam Voucher - ECC Remote Proctored
            localPath: 'C:/Users/hicha/.gemini/antigravity/brain/411c5cea-8e96-4c46-b3f7-aaf540ea31d4/char_remote_voucher_1769036628566.png',
            altText: 'CEH v13 Exam Voucher - Remote Proctored'
        }
    ];

    const bucketName = process.env.MINIO_BUCKET_NAME || 'public';

    for (const item of imagesToSeed) {
        try {
            if (!fs.existsSync(item.localPath)) {
                console.error(`❌ File not found: ${item.localPath}`);
                continue;
            }

            const fileBuffer = fs.readFileSync(item.localPath);
            const fileName = `products/${item.productId}/${path.basename(item.localPath)}`;

            console.log(`Uploading ${fileName}...`);
            const url = await uploadFile(bucketName, fileName, fileBuffer, 'image/png');

            console.log(`Updating database for product ${item.productId}...`);

            // Delete existing primary images if any
            await prisma.productImage.deleteMany({
                where: { productId: item.productId }
            });

            await prisma.productImage.create({
                data: {
                    productId: item.productId,
                    url: url,
                    altText: item.altText,
                    isPrimary: true,
                    position: 0
                }
            });

            console.log(`✅ Success for ${item.productId}: ${url}`);
        } catch (error) {
            console.error(`❌ Error seeding ${item.productId}:`, error);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
