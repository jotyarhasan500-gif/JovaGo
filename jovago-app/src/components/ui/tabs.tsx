"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-orientation={orientation}
      className={cn(
        "inline-flex items-center justify-start gap-1 rounded-lg p-1 text-muted-foreground",
        orientation === "horizontal"
          ? "h-10 w-full flex-row border-b border-border bg-transparent"
          : "h-auto min-w-[200px] flex-col border-r border-border bg-muted/30",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium outline-none transition-all",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm",
        "data-[orientation=horizontal]:data-[active]:border-b-2 data-[orientation=horizontal]:data-[active]:border-primary data-[orientation=horizontal]:-mb-px",
        "hover:text-foreground hover:bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "mt-4 outline-none",
        "data-[orientation=horizontal]:mt-6",
        "data-[orientation=vertical]:mt-0 data-[orientation=vertical]:pl-4",
        "animate-in fade-in-0 duration-200",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
