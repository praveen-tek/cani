"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { Globe } from "@phosphor-icons/react";
import React, { createContext, useContext, useState } from "react";

const SourceContext = createContext<{
  href: string;
  domain: string;
} | null>(null);

function useSourceContext() {
  const ctx = useContext(SourceContext);
  if (!ctx) throw new Error("Source.* must be used inside <Source>");
  return ctx;
}

export type SourceProps = {
  href: string;
  children: React.ReactNode;
};

export function Source({ href, children }: SourceProps) {
  let domain = "";
  try {
    domain = new URL(href).hostname;
  } catch {
    domain = href.split("/").pop() || href;
  }

  return (
    <SourceContext.Provider value={{ href, domain }}>
      <HoverCard openDelay={150} closeDelay={0}>
        {children}
      </HoverCard>
    </SourceContext.Provider>
  );
}

export type SourceTriggerProps = {
  label?: string | number;
  showFavicon?: boolean;
  className?: string;
};

export function SourceTrigger({
  label,
  showFavicon = false,
  className,
}: SourceTriggerProps) {
  const { href, domain } = useSourceContext();
  const [hasFaviconError, setHasFaviconError] = useState(false);
  const labelToShow = label ?? domain.replace("www.", "");

  return (
    <HoverCardTrigger asChild>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 inline-flex h-6 max-w-48 items-center gap-1.5 overflow-hidden rounded-full py-0 text-xs no-underline transition-colors duration-150 font-normal shadow-none",
          showFavicon ? "pr-2.5 pl-1.5" : "px-2.5",
          className
        )}
      >
        {showFavicon &&
          (!hasFaviconError ? (
            <img
              src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                href
              )}`}
              alt="favicon"
              width={14}
              height={14}
              className="size-3.5 rounded-full object-contain shrink-0"
              onError={() => setHasFaviconError(true)}
            />
          ) : (
            <Globe size={14} weight="light" className="text-neutral-500 shrink-0" />
          ))}
        <span className="truncate tabular-nums text-center font-normal">
          {labelToShow}
        </span>
      </a>
    </HoverCardTrigger>
  );
}

export type SourceContentProps = {
  title: string;
  description: string;
  className?: string;
};

export function SourceContent({
  title,
  description,
  className,
}: SourceContentProps) {
  const { href, domain } = useSourceContext();
  const [hasFaviconError, setHasFaviconError] = useState(false);

  return (
    <HoverCardContent className={cn("w-80 p-0 rounded-2xl border border-neutral-200 bg-white shadow-none font-normal", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-2 p-3 font-normal"
      >
        <div className="flex items-center gap-1.5">
          {!hasFaviconError ? (
            <img
              src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                href
              )}`}
              alt="favicon"
              className="size-4 rounded-full object-contain shrink-0"
              width={16}
              height={16}
              onError={() => setHasFaviconError(true)}
            />
          ) : (
            <Globe size={16} weight="light" className="text-neutral-500 shrink-0" />
          )}
          <div className="text-neutral-500 truncate text-xs font-normal">
            {domain.replace("www.", "")}
          </div>
        </div>
        <div className="line-clamp-2 text-xs font-normal text-neutral-900">{title}</div>
        {description && (
          <div className="text-neutral-500 line-clamp-2 text-xs font-normal">
            {description}
          </div>
        )}
      </a>
    </HoverCardContent>
  );
}
