"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CaretDown, Check } from "@phosphor-icons/react";

export function MarketSwitcher({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "pill";
}) {
  const profile = useQuery(api.profiles.me);
  const setCountryMutation = useMutation(api.profiles.setCountry);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentCountry = (profile?.country === "IN" ? "IN" : "US") as
    | "IN"
    | "US";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: "IN" | "US") => {
    void setCountryMutation({ country: val });
    setIsOpen(false);
  };

  const label =
    currentCountry === "IN" ? "India (₹ INR)" : "United States ($ USD)";

  return (
    <div className={`relative inline-block ${className || ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          variant === "pill"
            ? "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-normal text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
            : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-normal text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 transition cursor-pointer"
        }
      >
        <span>{label}</span>
        <CaretDown size={12} weight="light" className="text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-1.5 left-0 w-44 bg-white rounded-2xl border border-neutral-200 p-1 z-50">
          <button
            type="button"
            onClick={() => handleSelect("IN")}
            className={`w-full text-left px-3 py-1.5 text-xs font-normal rounded-xl transition flex items-center justify-between cursor-pointer ${
              currentCountry === "IN"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <span>India (₹ INR)</span>
            {currentCountry === "IN" && <Check size={12} weight="light" />}
          </button>
          <button
            type="button"
            onClick={() => handleSelect("US")}
            className={`w-full text-left px-3 py-1.5 text-xs font-normal rounded-xl transition flex items-center justify-between cursor-pointer ${
              currentCountry === "US"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <span>United States ($ USD)</span>
            {currentCountry === "US" && <Check size={12} weight="light" />}
          </button>
        </div>
      )}
    </div>
  );
}
