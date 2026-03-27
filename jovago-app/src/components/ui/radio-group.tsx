"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<"div"> & {
  role?: "radiogroup";
  "aria-label"?: string;
}) {
  return (
    <div
      role="radiogroup"
      data-slot="radio-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  id,
  value,
  checked,
  onChange,
  children,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  value: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const uniqId = React.useId();
  const inputId = id ?? uniqId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-input px-4 py-3 text-sm transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
        className
      )}
    >
      <input
        type="radio"
        id={inputId}
        value={value}
        checked={checked}
        onChange={onChange}
        data-state={checked ? "checked" : "unchecked"}
        className="size-4 border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
        {...props}
      />
      {children}
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
