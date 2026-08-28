import { statSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

/** 策略 C：三档尺寸 */
export const IMAGE_LIMITS = {
  thumb: 400,
  display: 1920,
  original: 4096,
} as const;

export const WEBP_QUALITY = {
  thumb: 78,
  display: 82,
} as const;

export const ORIGINAL_JPEG_QUALITY = 90;

export type ProcessedImageFiles = {
  displayFilename: string;
  thumbFilename: string;
  originalFilename: string;
  displaySize: number;
};

function pickOriginalExt(mimetype: string, originalname: string) {
  const name = originalname.toLowerCase();
  if (mimetype === 'image/png' || name.endsWith('.png')) return '.png';
  if (mimetype === 'image/webp' || name.endsWith('.webp')) return '.webp';
  return '.jpg';
}

/**
 * 上传图片生成三档：
 * - thumb  400px WebP  → 列表/后台预览
 * - display 1920px WebP → 官网展示
 * - original ≤4096px    → 下载/归档
 */
export async function processImageUpload(
  buffer: Buffer,
  uploadDir: string,
  mimetype: string,
  originalname: string,
): Promise<ProcessedImageFiles> {
  const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const displayFilename = `disp-${baseId}.webp`;
  const thumbFilename = `thumb-${baseId}.webp`;
  const originalFilename = `orig-${baseId}${pickOriginalExt(mimetype, originalname)}`;

  const resizeOriginal = {
    fit: 'inside' as const,
    withoutEnlargement: true,
  };

  const originalPath = join(uploadDir, originalFilename);
  const originalPipeline = sharp(buffer)
    .rotate()
    .resize(IMAGE_LIMITS.original, IMAGE_LIMITS.original, resizeOriginal);

  if (originalFilename.endsWith('.png')) {
    await originalPipeline.png({ compressionLevel: 9 }).toFile(originalPath);
  } else if (originalFilename.endsWith('.webp')) {
    await originalPipeline.webp({ quality: 90 }).toFile(originalPath);
  } else {
    await originalPipeline
      .jpeg({ quality: ORIGINAL_JPEG_QUALITY, mozjpeg: true })
      .toFile(originalPath);
  }

  const displayPath = join(uploadDir, displayFilename);
  await sharp(buffer)
    .rotate()
    .resize(IMAGE_LIMITS.display, IMAGE_LIMITS.display, resizeOriginal)
    .webp({ quality: WEBP_QUALITY.display })
    .toFile(displayPath);

  const thumbPath = join(uploadDir, thumbFilename);
  await sharp(buffer)
    .rotate()
    .resize(IMAGE_LIMITS.thumb, IMAGE_LIMITS.thumb, resizeOriginal)
    .webp({ quality: WEBP_QUALITY.thumb })
    .toFile(thumbPath);

  return {
    displayFilename,
    thumbFilename,
    originalFilename,
    displaySize: statSync(displayPath).size,
  };
}
