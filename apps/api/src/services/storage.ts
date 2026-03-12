import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { storeGeneratedDocumentInputSchema } from "@atm/shared";

type UploadInput = {
  fileName: string;
  mimeType: string;
  contentBase64: string;
  folder: string;
};

type UploadedObject = {
  key: string;
  url: string;
  contentType: string;
};

const r2Configured =
  Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) &&
  process.env.R2_ACCOUNT_ID !== "change-me" &&
  process.env.R2_ACCESS_KEY_ID !== "change-me" &&
  process.env.R2_SECRET_ACCESS_KEY !== "change-me";

const r2Client = r2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
      }
    })
  : null;

const sanitizeSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const localUploadsRoot = path.resolve(process.cwd(), ".uploads");

export const uploadBase64Asset = async (input: UploadInput): Promise<UploadedObject> => {
  const buffer = Buffer.from(input.contentBase64, "base64");
  const fileName = sanitizeSegment(input.fileName) || "file";
  const key = `${sanitizeSegment(input.folder)}/${randomUUID()}-${fileName}`;

  if (r2Client) {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: input.mimeType
      })
    );

    return {
      key,
      url: `${process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? ""}/${key}`,
      contentType: input.mimeType
    };
  }

  const filePath = path.join(localUploadsRoot, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  return {
    key,
    url: `http://localhost:4000/uploads/${key}`,
    contentType: input.mimeType
  };
};

export const storeGeneratedDocument = async (inputValue: unknown): Promise<UploadedObject> => {
  const input = storeGeneratedDocumentInputSchema.parse(inputValue);
  return uploadBase64Asset({
    fileName: input.fileName,
    mimeType: input.mimeType,
    contentBase64: input.contentBase64,
    folder: input.folder
  });
};