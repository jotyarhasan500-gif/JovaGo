"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const USER_POSTS_BUCKET = "user-posts";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,region,country`
    );
    const data = await res.json();
    const features = data?.features ?? [];
    const first = features[0];
    return first?.place_name ?? null;
  } catch {
    return null;
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

type PostFormProps = {
  lat: number;
  lng: number;
  onSuccess?: () => void;
  className?: string;
};

export function PostForm({ lat, lng, onSuccess, className }: PostFormProps) {
  const { user } = useUser();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) {
      toast.error("You must be logged in");
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

      const location_name = await reverseGeocode(lat, lng);

      const insertData = [
        {
          user_id: user.id,
          image_url: imageUrl,
          caption: caption.trim() || null,
          location_name,
          latitude: lat,
          longitude: lng,
          created_at: new Date().toISOString(),
        },
      ];
      console.log("posts insert data", insertData);

      const { error: insertError } = await supabase.from("posts").insert(insertData);

      if (insertError) {
        console.dir(insertError);
        toast.error(insertError.message);
        return;
      }

      console.log("Post created successfully", { user_id: user.id, image_url: imageUrl });
      toast.success("Post created!");
      setCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (err) {
      console.dir(err);
      const message = err instanceof Error ? err.message : "Failed to create post.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
    >
      <div className="space-y-2">
        <Label htmlFor="postform-image" className="text-slate-300">
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
            id="postform-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            disabled={loading}
            aria-label="Select image"
          />
          {selectedFile ? (
            <span className="text-sm font-medium text-slate-200">{selectedFile.name}</span>
          ) : (
            <>
              <ImagePlus className="size-8 text-slate-500" aria-hidden />
              <span className="mt-1 text-sm text-slate-400">Click to select one image</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postform-caption" className="text-slate-300">
          Caption
        </Label>
        <Textarea
          id="postform-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className="min-h-[80px] border-slate-600 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !selectedFile || !user}
        className="w-full bg-[#0066FF] hover:bg-[#0052cc]"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Uploading…
          </>
        ) : (
          "Post"
        )}
      </Button>
    </form>
  );
}
