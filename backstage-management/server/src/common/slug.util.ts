import type { PrismaService } from '../prisma/prisma.service';

export function slugify(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

export function buildProductSlugBase(sku: string, englishName?: string): string {
  const fromSku = slugify(sku);
  if (fromSku) return fromSku;
  return slugify(englishName || '');
}

type SlugLookupClient = Pick<PrismaService, 'product'>;

export async function resolveUniqueProductSlug(
  prisma: SlugLookupClient,
  base: string,
  options?: {
    excludeId?: number;
    reserved?: Set<string>;
  },
): Promise<string> {
  const normalized = slugify(base);
  if (!normalized) {
    throw new Error('无法生成 URL 别名');
  }

  const reserved = options?.reserved ?? new Set<string>();
  let candidate = normalized;
  let suffix = 2;

  while (true) {
    if (reserved.has(candidate)) {
      candidate = `${normalized}-${suffix++}`;
      continue;
    }

    const found = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(options?.excludeId ? { NOT: { id: options.excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!found) {
      reserved.add(candidate);
      return candidate;
    }

    candidate = `${normalized}-${suffix++}`;
  }
}
