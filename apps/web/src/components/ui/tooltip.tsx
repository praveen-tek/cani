"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root {...props} />;
}

interface TooltipTriggerProps extends TooltipPrimitive.Trigger.Props {
  asChild?: boolean;
}

function TooltipTrigger({ asChild, children, ...props }: TooltipTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <TooltipPrimitive.Trigger
        render={children as React.ReactElement}
        {...props}
      />
    );
  }
  return <TooltipPrimitive.Trigger {...props}>{children}</TooltipPrimitive.Trigger>;
}

interface TooltipContentProps extends TooltipPrimitive.Popup.Props {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 4,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-[100] pointer-events-none"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-[100] pointer-events-none overflow-hidden rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-normal text-neutral-50 animate-in fade-in-0 zoom-in-95",
            className
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
