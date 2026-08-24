import { AssetType } from '@prisma/client';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

export type MediaFile = {
  url: string;
  name: string;
};

export type MediaAsset = MediaFile & {
  id?: number;
  size: number | null;
  thumbnailUrl?: string | null;
};

export type ProductI18nContent = {
  name: string;
  description: string;
  material: string;
  size: string;
  color: string;
  seoTitle: string;
  seoKeywords: string;
  seoDescription: string;
};

function fileNameFromUrl(url: string) {
  try {
    const pathname = url.startsWith('http') ? new URL(url).pathname : url;
    const name = decodeURIComponent(pathname.split('/').pop() || '');
    return name || 'file';
  } catch {
    return 'file';
  }
}

function sizeFromUrl(url: string, uploadDir: string): number | null {
  try {
    const pathname = url.startsWith('http') ? new URL(url).pathname : url;
    const marker = '/uploads/';
    const idx = pathname.indexOf(marker);
    if (idx < 0) return null;
    const relative = pathname.slice(idx + marker.length);
    if (!relative || relative.includes('..')) return null;
    const abs = join(process.cwd(), uploadDir, relative);
    return existsSync(abs) ? statSync(abs).size : null;
  } catch {
    return null;
  }
}

function toSingle(
  url?: string | null,
  name?: string | null,
): MediaFile | null {
  if (!url) return null;
  return {
    url,
    name: name || fileNameFromUrl(url),
  };
}

function toAsset(
  item: {
    id?: number;
    url: string;
    name?: string | null;
    size?: number | null;
    thumbnailUrl?: string | null;
  },
  uploadDir: string,
): MediaAsset {
  return {
    id: item.id,
    url: item.url,
    name: item.name || fileNameFromUrl(item.url),
    size: item.size ?? sizeFromUrl(item.url, uploadDir),
    thumbnailUrl: item.thumbnailUrl || undefined,
  };
}

function isPackAsset(asset: {
  type?: AssetType | string;
  name?: string | null;
  url?: string;
}) {
  if (asset.type && asset.type !== AssetType.OTHER) return false;
  const n = `${asset.name || ''} ${asset.url || ''}`.toLowerCase();
  return n.includes('.zip') || asset.type === AssetType.OTHER;
}

function serializeCategory(category?: Record<string, any> | null) {
  if (!category) return null;
  return {
    id: category.id,
    code: category.code,
    parentId: category.parentId ?? null,
    nameZh: category.nameZh,
    nameEn: category.nameEn,
    parent: category.parent
      ? {
          id: category.parent.id,
          code: category.parent.code,
          nameZh: category.parent.nameZh,
          nameEn: category.parent.nameEn,
        }
      : null,
  };
}

function serializeI18n(
  rows?: Array<Record<string, any>> | null,
): Record<string, ProductI18nContent> {
  const map: Record<string, ProductI18nContent> = {};
  for (const row of rows || []) {
    if (!row?.locale) continue;
    map[row.locale] = {
      name: row.name || '',
      description: row.description || '',
      material: row.material || '',
      size: row.size || '',
      color: row.color || '',
      seoTitle: row.seoTitle || '',
      seoKeywords: row.seoKeywords || '',
      seoDescription: row.seoDescription || '',
    };
  }
  return map;
}

function serializeVehicles(binds?: Array<Record<string, any>> | null) {
  const list: Array<{
    id: number;
    code: string;
    brandZh: string;
    brandEn: string;
    modelZh: string;
    modelEn: string;
    yearFrom: number | null;
    yearTo: number | null;
  }> = [];
  for (const bind of binds || []) {
    const vehicle = bind.vehicle || bind;
    if (!vehicle?.id) continue;
    list.push({
      id: vehicle.id,
      code: vehicle.code,
      brandZh: vehicle.brandZh,
      brandEn: vehicle.brandEn,
      modelZh: vehicle.modelZh,
      modelEn: vehicle.modelEn,
      yearFrom: vehicle.yearFrom ?? null,
      yearTo: vehicle.yearTo ?? null,
    });
  }
  return list;
}

export type SerializedProduct = {
  id: number;
  sku: string;
  slug: string;
  status: string;
  sort: number;
  isNew: boolean;
  isHot: boolean;
  isFeatured: boolean;
  installLevel: string | null;
  categoryId: number;
  category: ReturnType<typeof serializeCategory>;
  i18n: Record<string, ProductI18nContent>;
  vehicles: Array<{
    id: number;
    code: string;
    brandZh: string;
    brandEn: string;
    modelZh: string;
    modelEn: string;
    yearFrom: number | null;
    yearTo: number | null;
  }>;
  cover: MediaFile | null;
  promoVideo: MediaFile | null;
  installVideo: MediaFile | null;
  materials: MediaAsset[];
  manuals: MediaAsset[];
  assetPacks: MediaAsset[];
  createdAt: Date | string;
  updatedAt: Date | string;
  related?: SerializedProduct[];
  hasAssetPack?: boolean;
};

type SerializeExtra = {
  related?: Array<Record<string, any>>;
  hasAssetPack?: boolean;
};

/** 产品读写接口统一输出对象，不再把库表字段整包展开 */
export function serializeProduct(
  product: Record<string, any>,
  extra?: SerializeExtra,
  uploadDir = process.env.UPLOAD_DIR || 'uploads',
): SerializedProduct {
  const assets = (product.assets || []) as Array<{
    id?: number;
    type?: AssetType | string;
    url: string;
    name?: string | null;
    size?: number | null;
    thumbnailUrl?: string | null;
  }>;

  const materials = assets
    .filter((a) => !a.type || a.type === AssetType.IMAGE)
    .map((a) => toAsset(a, uploadDir));
  const manuals = assets
    .filter((a) => a.type === AssetType.PDF)
    .map((a) => toAsset(a, uploadDir));
  const assetPacks = assets
    .filter((a) => isPackAsset(a))
    .map((a) => toAsset(a, uploadDir));

  if (
    product.assetPackUrl &&
    !assetPacks.some((item) => item.url === product.assetPackUrl)
  ) {
    assetPacks.unshift(
      toAsset(
        { url: product.assetPackUrl, name: '素材包.zip', size: null },
        uploadDir,
      ),
    );
  }

  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    status: product.status,
    sort: product.sort ?? 0,
    isNew: Boolean(product.isNew),
    isHot: Boolean(product.isHot),
    isFeatured: Boolean(product.isFeatured),
    installLevel: product.installLevel ?? null,
    categoryId: product.categoryId,
    category: serializeCategory(product.category),
    i18n: serializeI18n(product.i18n),
    vehicles: serializeVehicles(product.vehicles),
    cover: toSingle(product.coverUrl, product.coverName),
    promoVideo: toSingle(product.promoVideoUrl, product.promoVideoName),
    installVideo: toSingle(product.installVideoUrl, product.installVideoName),
    materials,
    manuals,
    assetPacks,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    ...(extra?.related
      ? { related: extra.related.map((row) => serializeProduct(row)) }
      : {}),
    ...(typeof extra?.hasAssetPack === 'boolean'
      ? { hasAssetPack: extra.hasAssetPack }
      : {}),
  };
}

export const shapeProductMedia = serializeProduct;
