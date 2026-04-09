import { Client } from "minio"

// Singleton MinIO client
let _client: Client | null = null

function getClient(): Client {
  if (_client) return _client

  _client = new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: parseInt(process.env.MINIO_PORT ?? "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "",
    secretKey: process.env.MINIO_SECRET_KEY ?? "",
  })

  return _client
}

export const BUCKETS = {
  applications: process.env.MINIO_BUCKET_APPLICATIONS ?? "mdf-applications",
  projects: process.env.MINIO_BUCKET_PROJECTS ?? "mdf-projects",
} as const

/**
 * Dosyayı MinIO'ya yükler ve object key'i döndürür.
 */
export async function uploadFile({
  bucket,
  key,
  buffer,
  mimeType,
  size,
}: {
  bucket: string
  key: string
  buffer: Buffer
  mimeType: string
  size: number
}): Promise<string> {
  const client = getClient()

  await client.putObject(bucket, key, buffer, size, {
    "Content-Type": mimeType,
  })

  return key
}

/**
 * Dosyayı MinIO'dan siler.
 */
export async function deleteFile(bucket: string, key: string): Promise<void> {
  const client = getClient()
  await client.removeObject(bucket, key)
}

/**
 * Dosyayı MinIO'dan stream olarak döndürür.
 * Presigned URL yerine proxy yaklaşımı kullanılır — Docker içi hostname
 * (minio:9000) tarayıcıya gönderilmez.
 */
export async function getFileStream(
  bucket: string,
  key: string
): Promise<NodeJS.ReadableStream> {
  const client = getClient()
  return client.getObject(bucket, key)
}

/**
 * Bucket var mı kontrol eder, yoksa oluşturur.
 */
export async function ensureBucket(bucket: string): Promise<void> {
  const client = getClient()
  const exists = await client.bucketExists(bucket)
  if (!exists) await client.makeBucket(bucket)
}
