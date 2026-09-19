"use client";

import { useState } from "react";
import {
  ArrowSquareOut,
  ImageSquare,
  Plus,
  Star,
  Tag,
} from "@phosphor-icons/react";
import { upgradeImageUrl } from "@/lib/image-url";

export interface ProductCardItem {
  _id?: string;
  title: string;
  url: string;
  imageUrl?: string;
  price?: number;
  salePrice?: number;
  currency?: string;
  source: string;
  onSale?: boolean;
  rating?: number;
  reason?: string;
}

function formatPrice(amount?: number, currency = "USD", locale = "en-US") {
  if (typeof amount !== "number" || isNaN(amount)) return null;
  const isINR = currency === "INR";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: isINR ? 0 : 2,
      minimumFractionDigits: isINR ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function ProductCard({
  item,
  onAddToTeam,
  fallbackCurrency = "USD",
}: {
  item: ProductCardItem;
  onAddToTeam: () => void;
  fallbackCurrency?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(
    () => upgradeImageUrl(item.imageUrl) || item.imageUrl
  );
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (currentSrc && item.imageUrl && currentSrc !== item.imageUrl) {
      setCurrentSrc(item.imageUrl);
    } else {
      setHasError(true);
    }
  };

  const itemCurrency = item.currency || fallbackCurrency;
  const itemLocale = itemCurrency === "INR" ? "en-IN" : "en-US";
  const formattedSale = formatPrice(item.salePrice, itemCurrency, itemLocale);
  const formattedOrig = formatPrice(item.price, itemCurrency, itemLocale);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden hover:border-neutral-300 transition-all flex flex-col justify-between font-normal">
      <div>
        <div
          className={`w-full bg-neutral-100 rounded-t-2xl overflow-hidden ${
            !loaded && !hasError && Boolean(currentSrc) ? "min-h-[160px]" : ""
          }`}
        >
          {!hasError && currentSrc ? (
            <img
              src={currentSrc}
              alt={item.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="block w-full h-auto"
              onLoad={() => setLoaded(true)}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center text-neutral-400">
              <ImageSquare size={32} weight="light" />
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-2xs">
            <span className="font-mono text-neutral-400 uppercase font-normal truncate max-w-[120px]">
              {item.source}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {typeof item.rating === "number" && (
                <span className="inline-flex items-center gap-1 font-mono text-neutral-600 font-normal">
                  <Star size={12} weight="light" className="text-amber-500" />
                  <span>{item.rating.toFixed(1)}</span>
                </span>
              )}
              {item.onSale && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-normal border border-rose-200">
                  <Tag size={10} weight="light" />
                  <span>ON SALE</span>
                </span>
              )}
            </div>
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="font-serif text-sm text-neutral-900 font-normal line-clamp-2 hover:underline block"
          >
            {item.title}
          </a>

          {item.reason && (
            <p className="text-2xs text-neutral-500 line-clamp-1 font-normal">
              {item.reason}
            </p>
          )}

          <div className="flex items-baseline gap-2 pt-1 font-normal">
            {formattedSale ? (
              <>
                <span className="text-sm font-normal text-neutral-900 font-mono">
                  {formattedSale}
                </span>
                {formattedOrig && (
                  <span className="text-xs text-neutral-400 line-through font-mono font-normal">
                    {formattedOrig}
                  </span>
                )}
              </>
            ) : formattedOrig ? (
              <span className="text-sm font-normal text-neutral-900 font-mono">
                {formattedOrig}
              </span>
            ) : (
              <span className="text-xs text-neutral-400 font-mono font-normal">
                Check site for price
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 border-t border-neutral-100 mt-2 flex items-center justify-between gap-2 font-normal">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-2xs text-neutral-500 hover:text-neutral-900 underline transition font-normal"
        >
          View product
        </a>

        <button
          type="button"
          onClick={onAddToTeam}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-2xs font-normal transition cursor-pointer"
        >
          <Plus size={12} weight="light" />
          <span>Add to team</span>
        </button>
      </div>
    </div>
  );
}
