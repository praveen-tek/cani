export function upgradeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith("flixcart.com") || host.endsWith("flipkart.com")) {
      parsed.pathname = parsed.pathname.replace(
        /\/image\/\d+\/\d+\//,
        "/image/832/832/"
      );
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}
