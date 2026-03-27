"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient, hasVaultStorage } from "@/lib/supabase/admin";

const VAULT_BUCKET = "vault";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export type VaultDocument = {
  name: string;
  path: string;
  createdAt: string;
};

export type UploadVaultResult =
  | { success: true; path: string }
  | { success: false; error: string };

export type ListVaultResult =
  | { success: true; documents: VaultDocument[] }
  | { success: false; error: string };

export type DeleteVaultResult = { success: true } | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function uploadVaultDocument(formData: FormData): Promise<UploadVaultResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Please sign in to upload documents." };

  if (!hasVaultStorage()) {
    return {
      success: false,
      error: "Vault storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to enable uploads.",
    };
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File is too large. Maximum size is 10 MB." };
  }

  const type = file.type?.toLowerCase();
  if (!type || !ALLOWED_TYPES.includes(type)) {
    const allowed = "PDF, JPEG, PNG, WebP, GIF";
    return { success: false, error: `Invalid file type. Allowed: ${allowed}.` };
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(VAULT_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, path };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    return { success: false, error: message };
  }
}

export async function listVaultDocuments(): Promise<ListVaultResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Please sign in to view your vault." };

  if (!hasVaultStorage()) {
    return { success: true, documents: [] };
  }

  try {
    const supabase = createAdminClient();
    const { data: files, error } = await supabase.storage
      .from(VAULT_BUCKET)
      .list(userId, { sortBy: { column: "created_at", order: "desc" } });

    if (error) return { success: false, error: error.message };

    const documents: VaultDocument[] = (files ?? [])
      .filter((f) => f.name && f.id)
      .map((f) => ({
        name: f.name ?? "Document",
        path: `${userId}/${f.name}`,
        createdAt: f.created_at ?? new Date().toISOString(),
      }));

    return { success: true, documents };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list documents.";
    return { success: false, error: message };
  }
}

export async function deleteVaultDocument(path: string): Promise<DeleteVaultResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Please sign in to delete documents." };

  if (!path.startsWith(userId + "/")) {
    return { success: false, error: "You can only delete your own documents." };
  }

  if (!hasVaultStorage()) {
    return { success: false, error: "Vault storage is not configured." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(VAULT_BUCKET).remove([path]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete document.";
    return { success: false, error: message };
  }
}

/** Returns a signed URL to download a vault file; only for the owner. */
export async function getVaultDownloadUrl(path: string): Promise<{ url: string } | { error: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in to download documents." };
  if (!path.startsWith(userId + "/")) return { error: "Access denied." };
  if (!hasVaultStorage()) return { error: "Vault storage is not configured." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(path, 60);
    if (error) return { error: error.message };
    if (!data?.signedUrl) return { error: "Could not generate download link." };
    return { url: data.signedUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Download failed.";
    return { error: message };
  }
}
