import * as Minio from 'minio';

// Create MinIO client
let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    const endpoint = process.env.MINIO_ENDPOINT || '';
    const port = parseInt(process.env.MINIO_PORT || '443');
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ACCESS_KEY || '';
    const secretKey = process.env.MINIO_SECRET_KEY || '';

    if (!endpoint || !accessKey || !secretKey) {
      throw new Error('MinIO configuration is missing. Please check MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY environment variables.');
    }

    minioClient = new Minio.Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });
  }

  return minioClient;
}

/**
 * Upload a file to MinIO
 * @param bucketName Bucket name
 * @param objectName Object name (path in bucket)
 * @param filePath Local file path or Buffer
 * @param metadata Optional metadata
 */
export async function uploadFile(
  bucketName: string,
  objectName: string,
  fileBuffer: Buffer,
  contentType: string = 'application/octet-stream',
  metadata: Record<string, string> = {}
): Promise<string> {
  const client = getMinioClient();

  try {
    // Check if bucket exists, create if it doesn't
    const bucketExists = await client.bucketExists(bucketName);
    if (!bucketExists) {
      await client.makeBucket(bucketName, process.env.MINIO_REGION || 'us-east-1');
      console.log(`✅ Bucket ${bucketName} created`);
    }

    // Upload file
    await client.putObject(
      bucketName,
      objectName,
      fileBuffer,
      fileBuffer.length,
      {
        'Content-Type': contentType,
        ...metadata,
      }
    );

    // Generate public URL
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || '';
    const url = `${protocol}://${endpoint}/${bucketName}/${objectName}`;

    console.log(`✅ File uploaded: ${url}`);
    return url;
  } catch (error) {
    console.error('❌ Error uploading file to MinIO:', error);
    throw error;
  }
}

/**
 * Delete a file from MinIO
 * @param bucketName Bucket name
 * @param objectName Object name
 */
export async function deleteFile(bucketName: string, objectName: string): Promise<void> {
  const client = getMinioClient();

  try {
    await client.removeObject(bucketName, objectName);
    console.log(`✅ File deleted: ${objectName}`);
  } catch (error) {
    console.error('❌ Error deleting file from MinIO:', error);
    throw error;
  }
}

/**
 * Get presigned URL for temporary access
 * @param bucketName Bucket name
 * @param objectName Object name
 * @param expiry Expiry time in seconds (default: 7 days)
 */
export async function getPresignedUrl(
  bucketName: string,
  objectName: string,
  expiry: number = 7 * 24 * 60 * 60
): Promise<string> {
  const client = getMinioClient();

  try {
    const url = await client.presignedGetObject(bucketName, objectName, expiry);
    return url;
  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    throw error;
  }
}

/**
 * List files in a bucket
 * @param bucketName Bucket name
 * @param prefix Optional prefix filter
 */
export async function listFiles(bucketName: string, prefix?: string): Promise<string[]> {
  const client = getMinioClient();

  return new Promise((resolve, reject) => {
    const stream = client.listObjects(bucketName, prefix, true);
    const files: string[] = [];

    stream.on('data', (obj) => {
      if (obj.name) {
        files.push(obj.name);
      }
    });

    stream.on('error', (err) => {
      reject(err);
    });

    stream.on('end', () => {
      resolve(files);
    });
  });
}
