"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateProfile, type ProfileRow } from "@/app/actions/profile";
import { Loader2, User, MapPin, Compass, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const TRAVEL_STYLES = [
  { value: "Backpacker", label: "Backpacker" },
  { value: "Luxury", label: "Luxury" },
  { value: "Adventure", label: "Adventure" },
  { value: "Solo", label: "Solo" },
  { value: "Group", label: "Group" },
] as const;

const INTEREST_OPTIONS = [
  "Photography",
  "Hiking",
  "Nightlife",
  "History",
  "Foodie",
  "Culture",
  "Adventure",
  "Wellness",
  "Yoga",
  "Wildlife",
  "Beach",
  "Music",
  "Art",
  "Shopping",
];

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  bio: z.string(),
  home_country: z.string(),
  travel_style: z.string(),
  interests: z.array(z.string()),
  linked_social_media: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProfileSettingsForm({
  initialProfile,
  userId,
}: {
  initialProfile: ProfileRow | null;
  userId: string;
}) {
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>(
    initialProfile?.interests ?? []
  );
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initialProfile?.full_name ?? "",
      bio: initialProfile?.bio ?? "",
      home_country: initialProfile?.home_country ?? "",
      travel_style: initialProfile?.travel_style ?? "Backpacker",
      interests: initialProfile?.interests ?? [],
      linked_social_media: initialProfile?.linked_social_media ?? false,
    },
  });

  useEffect(() => {
    if (initialProfile) {
      form.reset({
        full_name: initialProfile.full_name ?? "",
        bio: initialProfile.bio ?? "",
        home_country: initialProfile.home_country ?? "",
        travel_style: initialProfile.travel_style ?? "Backpacker",
        interests: initialProfile.interests ?? [],
        linked_social_media: initialProfile.linked_social_media ?? false,
      });
      setInterests(initialProfile.interests ?? []);
    }
  }, [initialProfile, form]);

  const toggleInterest = (interest: string) => {
    const next = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : [...interests, interest];
    setInterests(next);
    form.setValue("interests", next);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setSaving(true);
    const result = await updateProfile({
      ...data,
      interests,
      linked_social_media: form.getValues("linked_social_media"),
    });
    setSaving(false);
    if (result.success) {
      toast.success("Profile updated successfully.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="border-[#0066FF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0a0a0a]">
            <User className="size-5 text-[#0066FF]" />
            Basic info
          </CardTitle>
          <CardDescription>Your display name and short bio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
              Full name
            </label>
            <Input
              {...form.register("full_name")}
              placeholder="e.g. Alex Chen"
              className={cn(
                form.formState.errors.full_name && "border-destructive"
              )}
            />
            {form.formState.errors.full_name && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
              Bio
            </label>
            <Textarea
              {...form.register("bio")}
              placeholder="A short intro for other travelers..."
              className="min-h-[100px] resize-y"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="linked_social_media"
              className="size-4 rounded border-[#d4d4d4] text-[#0066FF] focus:ring-[#0066FF]"
              {...form.register("linked_social_media")}
            />
            <label
              htmlFor="linked_social_media"
              className="text-sm font-medium text-[#0a0a0a]"
            >
              I’ve linked my social media (+20 trust)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#0066FF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0a0a0a]">
            <MapPin className="size-5 text-[#0066FF]" />
            Location & style
          </CardTitle>
          <CardDescription>Where you’re from and how you travel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
              Home country
            </label>
            <Input
              {...form.register("home_country")}
              placeholder="e.g. USA"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
              Travel style
            </label>
            <Select
              value={form.watch("travel_style")}
              onValueChange={(v) => form.setValue("travel_style", v ?? "Backpacker")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {TRAVEL_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#0066FF]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0a0a0a]">
            <Heart className="size-5 text-[#0066FF]" />
            Interests
          </CardTitle>
          <CardDescription>
            Tap to add or remove. Shown on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = interests.includes(interest);
              return (
                <Badge
                  key={interest}
                  variant={selected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer border transition-colors",
                    selected
                      ? "bg-[#0066FF] text-white hover:bg-[#0052CC]"
                      : "hover:bg-[#0066FF]/10 hover:border-[#0066FF]/30"
                  )}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={`/profile/${userId}`}>
          <Button type="button" variant="outline">
            View public profile
          </Button>
        </Link>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </div>
    </form>
  );
}
