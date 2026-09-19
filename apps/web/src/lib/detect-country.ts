export function detectCountry(): "IN" | "US" {
  if (typeof window === "undefined") {
    return "US";
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = (navigator.language || navigator.languages?.[0] || "").toLowerCase();

    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta" || lang.endsWith("-in")) {
      return "IN";
    }

    if (
      tz.startsWith("America/") ||
      tz === "Pacific/Honolulu" ||
      lang.endsWith("-us")
    ) {
      return "US";
    }
  } catch {
    // fallback
  }

  return "US";
}
