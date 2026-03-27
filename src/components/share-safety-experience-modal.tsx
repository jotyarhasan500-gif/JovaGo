"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SAFETY_CITIES } from "@/lib/safety-map-data";
import { submitSafetyReport } from "@/app/actions/submit-safety-report";
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const safetyCategories = [
  { value: "solo-women", label: "Safe for Solo Women" },
  { value: "public-transport", label: "Public Transport Safety" },
  { value: "scam-risk", label: "Scam Risk" },
  { value: "friendly-locals", label: "Friendly Locals" },
] as const;

const schema = z.object({
  location: z.string().min(1, "Please select a city or country"),
  safetyRating: z.number().min(1, "Rating is required").max(10),
  category: z.enum([
    "solo-women",
    "public-transport",
    "scam-risk",
    "friendly-locals",
  ]),
  detailedInsight: z.string().optional(),
  postAnonymously: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface ShareSafetyExperienceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful submit so the parent can refresh map data */
  onSuccess?: () => void;
}

export function ShareSafetyExperienceModal({
  open,
  onOpenChange,
  onSuccess,
}: ShareSafetyExperienceModalProps) {
  const router = useRouter();
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success"
  >("idle");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      location: "",
      safetyRating: 0,
      category: "solo-women",
      detailedInsight: "",
      postAnonymously: false,
    },
  });

  const locationQuery = form.watch("location");
  const filteredCities = useMemo(() => {
    const q = (locationOpen ? locationSearch : locationQuery).toLowerCase();
    if (!q || q.length < 1) return SAFETY_CITIES.slice(0, 8);
    return SAFETY_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [locationOpen, locationSearch, locationQuery]);

  const handleSelectLocation = (name: string, country: string) => {
    form.setValue("location", `${name}, ${country}`, {
      shouldValidate: true,
    });
    setLocationSearch("");
    setLocationOpen(false);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitState("submitting");

    const result = await submitSafetyReport({
      locationName: data.location,
      safetyRating: data.safetyRating,
      category: data.category,
      comment: data.detailedInsight ?? null,
      isAnonymous: data.postAnonymously ?? false,
    });

    if (!result.success) {
      setSubmitState("idle");
      toast.error(result.error);
      return;
    }

    setSubmitState("success");
    toast.success(
      "Thank you! Your insight has improved JovaGo's safety for everyone."
    );

    router.refresh();
    onSuccess?.();

    await new Promise((r) => setTimeout(r, 800));
    form.reset();
    setLocationSearch("");
    setSubmitState("idle");
    onOpenChange(false);
  });

  const handleClose = (next: boolean) => {
    if (!next && submitState === "idle") {
      form.reset();
      setLocationSearch("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={submitState === "idle"}
        className="max-h-[90vh] overflow-y-auto border-border bg-card"
      >
        {submitState === "submitting" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-card/95">
            <Loader2 className="size-10 animate-spin text-[#0066FF]" />
            <p className="text-sm font-medium text-[#0066FF]">
              Submitting your safety insight...
            </p>
          </div>
        )}

        {submitState === "success" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-card/95">
            <CheckCircle2 className="size-12 text-[#22c55e]" />
            <p className="text-sm font-medium text-[#22c55e]">Thank you! Your tip was submitted.</p>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0a0a0a]">
            <ShieldCheck className="size-5 text-[#0066FF]" />
            Share Your Safety Experience
          </DialogTitle>
          <DialogDescription>
            Help other travelers by sharing safety insights. Your feedback is optional but valuable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Location: search-as-you-type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0a0a0a]">
              <MapPin className="size-4 text-[#0066FF]" />
              City / Country
            </label>
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger
                type="button"
                className={cn(
                  "flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30",
                  form.formState.errors.location && "border-destructive"
                )}
              >
                <span className={form.watch("location") ? "text-foreground" : "text-muted-foreground"}>
                  {form.watch("location") || "Search for a city or country..."}
                </span>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-0">
                <Input
                  placeholder="Type to search..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="border-0 border-b rounded-none focus-visible:ring-0"
                  autoFocus
                />
                <ul className="max-h-48 overflow-auto py-1">
                  {filteredCities.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(c.name, c.country)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[#0066FF]/5"
                      >
                        {c.name}, {c.country}
                      </button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
            {form.formState.errors.location && (
              <p className="text-xs text-destructive">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>

          {/* Safety Rating 1–10 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0a0a0a]">
              <ShieldCheck className="size-4 text-[#0066FF]" />
              Overall Safety (1–10)
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => form.setValue("safetyRating", n, { shouldValidate: true })}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    form.watch("safetyRating") === n
                      ? "border-[#0066FF] bg-[#0066FF] text-white"
                      : "border-input hover:bg-muted"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            {form.formState.errors.safetyRating && (
              <p className="text-xs text-destructive">
                {form.formState.errors.safetyRating.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#0a0a0a]">
              <AlertTriangle className="size-4 text-[#0066FF]" />
              Category
            </label>
            <RadioGroup
              aria-label="Safety category"
              className="gap-2"
            >
              {safetyCategories.map((cat) => (
                <RadioGroupItem
                  key={cat.value}
                  value={cat.value}
                  checked={form.watch("category") === cat.value}
                  onChange={() =>
                    form.setValue("category", cat.value, { shouldValidate: true })
                  }
                >
                  {cat.label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>

          {/* Detailed Insight */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0a0a0a]">
              Your advice (optional)
            </label>
            <Textarea
              placeholder="e.g. Avoid the Metro after 11 PM"
              {...form.register("detailedInsight")}
              className="min-h-[100px] resize-y"
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={form.watch("postAnonymously")}
              onCheckedChange={(checked) =>
                form.setValue("postAnonymously", !!checked)
              }
              aria-label="Post anonymously"
            />
            <label className="text-sm text-muted-foreground">
              Post Anonymously — encourages more honest feedback
            </label>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitState !== "idle"}>
              {submitState === "submitting" ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
