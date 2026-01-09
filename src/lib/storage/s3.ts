import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
});

const bucket = process.env.S3_BUCKET!;
const publicUrl = process.env.S3_PUBLIC_URL!;

/**
 * Upload HTML content to S3/MinIO
 * @param slug Profile slug (username)
 * @param content Full HTML string
 * @returns S3 object key (e.g., "profiles/john.html")
 */
export async function uploadHtml(
  slug: string,
  content: string
): Promise<string> {
  const key = `profiles/${slug}.html`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: "text/html; charset=utf-8",
    CacheControl: "public, max-age=31536000, immutable",
  });

  await s3Client.send(command);

  console.log(`[S3] ✅ Uploaded ${key} to ${bucket}`);

  return key;
}

/**
 * Get public CDN URL for a profile
 * @param slug Profile slug
 * @returns Full public URL (e.g., "https://cdn.pile.bio/profiles/john.html")
 */
export function getPublicUrl(slug: string): string {
  return `${publicUrl}/profiles/${slug}.html`;
}
