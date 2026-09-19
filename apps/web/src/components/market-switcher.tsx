"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function MarketSwitcher({ className }: { className?: string }) {
  const profile = useQuery(api.profiles.me);
  const setCountryMutation = useMutation(api.profiles.setCountry);

  const currentCountry = (profile?.country === "IN" ? "IN" : "US") as
    | "IN"
    | "US";

  return (
    <div className={`flex items-center gap-1.5 text-xs text-neutral-500 font-normal ${className || ""}`}>
      <span>Market:</span>
      <select
        value={currentCountry}
        onChange={(e) => {
          const val = e.target.value as "IN" | "US";
          void setCountryMutation({ country: val });
        }}
        className="bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-normal px-2.5 py-1 rounded-lg border border-neutral-200 focus:outline-none cursor-pointer"
      >
        <option value="IN">India (₹ INR)</option>
        <option value="US">United States ($ USD)</option>
      </select>
    </div>
  );
}
