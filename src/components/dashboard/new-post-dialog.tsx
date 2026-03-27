"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPostFromClient } from "@/app/actions/posts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const USER_POSTS_BUCKET = "user-posts";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewPostDialog({ open, onOpenChange }: Props) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) {
      toast.error("Please sign in to create a post.");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select an image.");
      return;
    }
    if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image is too large. Maximum size is 5 MB.");
      return;
    }
    const type = selectedFile.type?.toLowerCase();
    if (!type || !ALLOWED_TYPES.includes(type)) {
      toast.error("Invalid image type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    setLoading(true);
    try {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = sanitizeFileName(selectedFile.name) || `image.${ext}`;
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(USER_POSTS_BUCKET)
        .upload(path, selectedFile, { contentType: selectedFile.type, upsert: false });

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from(USER_POSTS_BUCKET).getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      const result = await createPostFromClient({
        image_url: imageUrl,
        caption,
        location_name: locationName,
      });
      if (result.success) {
        toast.success("Post created!");
        onOpenChange(false);
        setCaption("");
        setLocationName("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create post.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next && !loading) {
      setCaption("");
      setLocationName("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="border-slate-700 bg-slate-900 text-slate-100"
        showCloseButton={!loading}
      >
        <DialogHeader>
          <DialogTitle className="text-slate-100">Create New Post</DialogTitle>
          <DialogDescription className="text-slate-400">
            Share a photo with a caption and location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Picker */}
          <div className="space-y-2">
            <Label htmlFor="post-image" className="text-slate-300">
              Image
            </Label>
            <div
              className={cn(
                "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                selectedFile
                  ? "border-slate-600 bg-slate-800/50"
                  : "border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                id="post-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                aria-label="Select image"
              />
              {selectedFile ? (
                <span className="text-sm font-medium text-slate-200">
                  {selectedFile.name}
                </span>
              ) : (
                <>
                  <ImagePlus className="size-8 text-slate-500" aria-hidden />
                  <span className="mt-1 text-sm text-slate-400">
                    Click to select one image
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="post-caption" className="text-slate-300">
              Caption
            </Label>
            <Textarea
              id="post-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Short description..."
              className="min-h-[80px] border-slate-600 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="post-location" className="text-slate-300">
              Location
            </Label>
            <Input
              id="post-location"
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Name of the place"
              className="border-slate-600 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#0066FF] hover:bg-[#0052cc]">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Posting…
                </>
              ) : (
                "Post"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
