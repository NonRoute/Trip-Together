import * as Minio from "minio";

type StorageConfig = {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  publicUrlBase?: string;
};

let cachedClient: Minio.Client | null = null;

function getStorageConfig(): StorageConfig {
  const endPoint = process.env.MINIO_ENDPOINT || "localhost";
  const port = Number(process.env.MINIO_PORT || 9000);
  const useSSL =
    String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true";
  const accessKey =
    process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "admin";
  const secretKey =
    process.env.MINIO_SECRET_KEY ||
    process.env.MINIO_ROOT_PASSWORD ||
    "password";
  const bucket =
    process.env.MINIO_BUCKET || process.env.MINIO_DEFAULT_BUCKET || "upload";
  const region = process.env.MINIO_REGION || "us-east-1";
  const publicUrlBase = process.env.MINIO_PUBLIC_URL || process.env.MINIO_URL;

  return {
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
    bucket,
    region,
    publicUrlBase,
  };
}

export function getMinioClient(): Minio.Client {
  if (cachedClient) return cachedClient;
  const cfg = getStorageConfig();
  cachedClient = new Minio.Client({
    endPoint: cfg.endPoint,
    port: cfg.port,
    useSSL: cfg.useSSL,
    accessKey: cfg.accessKey,
    secretKey: cfg.secretKey,
  });
  return cachedClient;
}

export async function ensureBucketExists(bucketName?: string): Promise<void> {
  const client = getMinioClient();
  const { bucket, region } = getStorageConfig();
  const targetBucket = bucketName || bucket;

  const exists = await client.bucketExists(targetBucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(targetBucket, region);
    // Apply a public read policy to the newly created bucket
    await applyPublicReadPolicy(targetBucket).catch(() => {
      // Silently ignore policy errors to avoid blocking app startup
    });
  }
}

async function applyPublicReadPolicy(bucketName: string): Promise<void> {
  const client = getMinioClient();
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  } as const;

  // MinIO JS client expects policy as a JSON string
  const anyClient = client as unknown as {
    setBucketPolicy: (b: string, p: string) => Promise<void>;
  };
  await anyClient.setBucketPolicy(bucketName, JSON.stringify(policy));
}

function generateObjectKey(
  originalName?: string,
  explicitExtension?: string,
): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const datePath = `${yyyy}/${mm}/${dd}`;

  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

  const extFromName = originalName?.includes(".")
    ? originalName.split(".").pop()
    : undefined;
  const ext = (explicitExtension || extFromName || "")
    .replace(/^\./, "")
    .toLowerCase();

  return ext ? `${datePath}/${uuid}.${ext}` : `${datePath}/${uuid}`;
}

export type UploadImageOptions = {
  data: Buffer | Uint8Array;
  contentType?: string;
  filename?: string;
  bucketName?: string;
  objectKey?: string; // Optional custom key
};

export type UploadImageResult = {
  bucket: string;
  objectKey: string;
  publicUrl: string;
  presignedUrl?: string;
};

export async function uploadImage(
  options: UploadImageOptions,
): Promise<UploadImageResult> {
  const { data, contentType, filename, bucketName, objectKey } = options;
  const client = getMinioClient();
  const { bucket, publicUrlBase } = getStorageConfig();
  const targetBucket = bucketName || bucket;

  await ensureBucketExists(targetBucket);

  const key =
    objectKey ||
    generateObjectKey(filename, contentTypeToExtension(contentType));

  const meta: Minio.ItemBucketMetadata = {} as any;
  if (contentType) {
    (meta as any)["Content-Type"] = contentType;
  }

  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await client.putObject(
    targetBucket,
    key,
    dataBuffer,
    dataBuffer.length,
    meta,
  );

  const publicUrl = buildPublicUrl(targetBucket, key, publicUrlBase);

  return { bucket: targetBucket, objectKey: key, publicUrl };
}

export async function getPresignedUrl(
  objectKey: string,
  expirySeconds = 3600,
  bucketName?: string,
): Promise<string> {
  const client = getMinioClient();
  const { bucket } = getStorageConfig();
  const targetBucket = bucketName || bucket;
  return client.presignedGetObject(targetBucket, objectKey, expirySeconds);
}

function buildPublicUrl(
  bucket: string,
  objectKey: string,
  base?: string,
): string {
  const { endPoint, port, useSSL } = getStorageConfig();
  if (base) {
    return `${base.replace(/\/$/, "")}/${bucket}/${encodeURI(objectKey)}`;
  }
  const proto = useSSL ? "https" : "http";
  return `${proto}://${endPoint}:${port}/${bucket}/${encodeURI(objectKey)}`;
}

function contentTypeToExtension(contentType?: string): string | undefined {
  if (!contentType) return undefined;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
  };
  return map[contentType];
}
