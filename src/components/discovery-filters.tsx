"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AgeRange, BudgetLevel, GenderFilter } from "@/lib/discovery-data";
import { Shield } from "lucide-react";

interface DiscoveryFiltersProps {
  gender: GenderFilter;
  age: AgeRange;
  budget: BudgetLevel;
  onGenderChange: (v: GenderFilter) => void;
  onAgeChange: (v: AgeRange) => void;
  onBudgetChange: (v: BudgetLevel) => void;
  className?: string;
}

const GENDER_OPTIONS: { value: GenderFilter; label: string; safety?: boolean }[] = [
  { value: "all", label: "All travelers" },
  { value: "female", label: "Female only", safety: true },
  { value: "male", label: "Male only" },
];

export function DiscoveryFilters({
  gender,
  age,
  budget,
  onGenderChange,
  onAgeChange,
  onBudgetChange,
  className,
}: DiscoveryFiltersProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-6 border-r border-border bg-background py-6 pr-6",
        className
      )}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Filters
      </h2>

      {/* Gender — support female-only for safety */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Gender</label>
        <div className="flex flex-col gap-1.5">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onGenderChange(opt.value)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                gender === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
              )}
            >
              <span>{opt.label}</span>
              {opt.safety && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Shield className="size-3" />
                  Safety
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Age</label>
        <Select
          value={age}
          onValueChange={(v) => onAgeChange(v as AgeRange)}
        >
          <SelectTrigger className="w-full border-input">
            <SelectValue placeholder="Any age" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any age</SelectItem>
            <SelectItem value="18-25">18 – 25</SelectItem>
            <SelectItem value="26-35">26 – 35</SelectItem>
            <SelectItem value="36-45">36 – 45</SelectItem>
            <SelectItem value="46+">46+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Budget</label>
        <Select
          value={budget}
          onValueChange={(v) => onBudgetChange(v as BudgetLevel)}
        >
          <SelectTrigger className="w-full border-input">
            <SelectValue placeholder="Any budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any budget</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="mid">Mid-range</SelectItem>
            <SelectItem value="luxury">Luxury</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
