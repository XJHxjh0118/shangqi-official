export function slugify(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export function buildProductSlugPreview(sku: string, englishName?: string): string {
  const fromSku = slugify(sku);
  if (fromSku) return fromSku;
  return slugify(englishName || "");
}
