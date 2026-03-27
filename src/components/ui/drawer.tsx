"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

function DrawerRoot({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: DialogPrimitive.Root.Props) {
  return (
    <DialogPrimitive.Root
      data-slot="drawer"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal
      {...props}
    />
  );
}

function DrawerPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal {...props} />;
}

function DrawerBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function DrawerViewport({
  className,
  ...props
}: DialogPrimitive.Viewport.Props) {
  return (
    <DialogPrimitive.Viewport
      data-slot="drawer-viewport"
      className={cn(
        "fixed z-50 flex",
        "inset-x-0 bottom-0 top-auto max-h-[85vh] justify-center p-0 md:inset-x-auto md:left-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:h-full md:max-w-md md:w-full",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        "md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right",
        className
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  showCloseButton = true,
  children,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DrawerPortal>
      <DrawerBackdrop />
      <DrawerViewport>
        <DialogPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "relative flex w-full flex-col gap-0 overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl outline-none md:rounded-none md:border-l",
            className
          )}
          {...props}
        >
          {showCloseButton && (
            <DialogPrimitive.Close
              className="absolute right-4 top-4 z-10 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          )}
          {children}
        </DialogPrimitive.Popup>
      </DrawerViewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 px-6 pt-6 pb-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg font-semibold leading-none pr-8", className)}
      {...props}
    />
  );
}

function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn("flex-1 overflow-y-auto px-6 pb-6", className)}
      {...props}
    />
  );
}

export {
  DrawerRoot as Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
};
