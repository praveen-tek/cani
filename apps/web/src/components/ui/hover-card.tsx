"use client";

import * as React from "react";
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { cn } from "@/lib/utils";

function HoverCard({
  openDelay = 150,
  closeDelay = 0,
  children,
  ...props
}: PreviewCardPrimitive.Root.Props & {
  openDelay?: number;
  closeDelay?: number;
}) {
  return (
    <PreviewCardPrimitive.Root {...props}>
      {children}
    </PreviewCardPrimitive.Root>
  );
}

interface HoverCardTriggerProps extends PreviewCardPrimitive.Trigger.Props {
  asChild?: boolean;
  openDelay?: number;
  closeDelay?: number;
}

function HoverCardTrigger({
  asChild,
  children,
  openDelay = 150,
  closeDelay = 0,
  ...props
}: HoverCardTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <PreviewCardPrimitive.Trigger
        delay={openDelay}
        closeDelay={closeDelay}
        render={children as React.ReactElement}
        {...props}
      />
    );
  }
  return (
    <PreviewCardPrimitive.Trigger
      delay={openDelay}
      closeDelay={closeDelay}
      {...props}
    >
      {children}
    </PreviewCardPrimitive.Trigger>
  );
}

interface HoverCardContentProps extends PreviewCardPrimitive.Popup.Props {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

function HoverCardContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  ...props
}: HoverCardContentProps) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "z-50 w-64 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-none outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
