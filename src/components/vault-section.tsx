"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  uploadVaultDocument,
  listVaultDocuments,
  deleteVaultDocument,
  getVaultDownloadUrl,
  type VaultDocument,
} from "@/app/actions/vault";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/gif";

function displayName(path: string): string {
  const name = path.split("/").pop() ?? path;
  const match = name.match(/^[0-9a-f-]{36}-(.+)$/i);
  return match ? match[1] : name;
}

export function VaultSection() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listVaultDocuments();
    setLoading(false);
    if (result.success) setDocuments(result.documents);
    else toast.error(result.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      setUploading(true);
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadVaultDocument(formData);
      setUploading(false);

      if (result.success) {
        toast.success("Document added to your vault.");
        load();
      } else {
        toast.error(result.error);
      }
    },
    [load]
  );

  const handleDelete = useCallback(
    async (path: string) => {
      const result = await deleteVaultDocument(path);
      if (result.success) {
        toast.success("Document removed.");
        setDocuments((prev) => prev.filter((d) => d.path !== path));
      } else {
        toast.error(result.error);
      }
    },
    []
  );

  const handleDownload = useCallback(async (path: string) => {
    const result = await getVaultDownloadUrl(path);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Card className="border-[#0066FF]/10">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-lg text-[#0a0a0a]">
            <Lock className="size-5 text-[#0066FF]" aria-hidden />
            Vault
          </CardTitle>
          <Badge
            variant="secondary"
            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          >
            Private
          </Badge>
        </div>
        <CardDescription>
          Store copies of your passport, visa, or other travel documents. Only you can see this
          section. PDF and images up to 10 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#0066FF]/20 bg-[#0066FF]/5 py-8 transition-colors hover:border-[#0066FF]/40 hover:bg-[#0066FF]/10">
          <input
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={uploading}
            onChange={handleUpload}
          />
          <Upload className="size-10 text-[#0066FF]" aria-hidden />
          <span className="text-sm font-medium text-[#0066FF]">
            {uploading ? "Uploading…" : "Click to upload or drag and drop"}
          </span>
          <span className="text-xs text-[#737373]">PDF, JPEG, PNG, WebP or GIF</span>
        </label>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your documents…</p>
        ) : documents.length > 0 ? (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.path}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate text-sm font-medium text-foreground" title={doc.path}>
                    {displayName(doc.path)}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.path)}
                  >
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(doc.path)}
                    aria-label={`Delete ${displayName(doc.path)}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No documents in your vault yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
