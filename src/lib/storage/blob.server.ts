import { put } from "@vercel/blob";

/**
 * Upload an image file to Vercel Blob storage
 */
export async function uploadImage(
  file: File | Blob,
  filename: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is required");
  }

  try {
    const blob = await put(filename, file, {
      access: "public",
      token,
    });

    return blob.url;
  } catch (error) {
    console.error("Error uploading image to Vercel Blob:", error);
    throw new Error("Failed to upload image to blob storage");
  }
}

/**
 * Upload image from a URL (fetch and upload)
 */
export async function uploadImageFromUrl(
  url: string,
  filename: string
): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const blob = await response.blob();
    return uploadImage(blob, filename || `image-${Date.now()}`);
  } catch (error) {
    console.error("Error uploading image from URL:", error);
    throw new Error("Failed to upload image from URL");
  }
}
