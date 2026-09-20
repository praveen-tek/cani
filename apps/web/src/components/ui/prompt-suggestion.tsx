"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export type PromptSuggestionProps = {
  children: React.ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  highlight?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function PromptSuggestion({
  children,
  variant,
  size,
  className,
  highlight,
  ...props
}: PromptSuggestionProps) {
  const isHighlightMode = highlight !== undefined && highlight.trim() !== "";
  const content = typeof children === "string" ? children : "";

  if (!isHighlightMode) {
    return (
      <Button
        variant={variant || "outline"}
        size={size || "lg"}
        className={cn(
          "rounded-full border border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-normal transition cursor-pointer shadow-none",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }

  if (!content) {
    return (
      <Button
        variant={variant || "ghost"}
        size={size || "sm"}
        className={cn(
          "w-full cursor-pointer justify-start rounded-xl py-2 hover:bg-neutral-100 font-normal shadow-none",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }

  const trimmedHighlight = highlight.trim();
  const contentLower = content.toLowerCase();
  const highlightLower = trimmedHighlight.toLowerCase();
  const shouldHighlight = contentLower.includes(highlightLower);

  return (
    <Button
      variant={variant || "ghost"}
      size={size || "sm"}
      className={cn(
        "w-full cursor-pointer justify-start gap-0 rounded-xl py-2 hover:bg-neutral-100 font-normal shadow-none",
        className
      )}
      {...props}
    >
      {shouldHighlight ? (
        (() => {
          const index = contentLower.indexOf(highlightLower);
          if (index === -1)
            return (
              <span className="text-neutral-500 whitespace-pre-wrap font-normal">
                {content}
              </span>
            );

          const actualHighlightedText = content.substring(
            index,
            index + highlightLower.length
          );

          const before = content.substring(0, index);
          const after = content.substring(index + actualHighlightedText.length);

          return (
            <>
              {before && (
                <span className="text-neutral-500 whitespace-pre-wrap font-normal">
                  {before}
                </span>
              )}
              <span className="text-neutral-900 font-normal whitespace-pre-wrap">
                {actualHighlightedText}
              </span>
              {after && (
                <span className="text-neutral-500 whitespace-pre-wrap font-normal">
                  {after}
                </span>
              )}
            </>
          );
        })()
      ) : (
        <span className="text-neutral-500 whitespace-pre-wrap font-normal">
          {content}
        </span>
      )}
    </Button>
  );
}

export { PromptSuggestion };
