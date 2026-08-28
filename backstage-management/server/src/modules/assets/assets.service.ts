import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetType } from '@prisma/client';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import sharp from 'sharp';
import { processImageUpload } from './image-processor';
import { serializeProduct } from '../products/product-media';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssetsService {
  private readonly uploadDir: string;
  private readonly publicBase: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') || 'uploads';
    this.publicBase =
      this.config.get<string>('PUBLIC_BASE_URL') || 'http://localhost:3001';
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private detectType(mimetype: string, filename: string): AssetType {
    const name = filename.toLowerCase();
    if (mimetype.startsWith('image/')) return AssetType.IMAGE;
    if (mimetype.startsWith('video/')) return AssetType.VIDEO;
    if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
      return AssetType.PDF;
    }
    return AssetType.OTHER;
  }

  /**
   * Multer/busboy 按 latin1 解析 Content-Disposition，中文文件名会乱码。
   * 优先使用前端单独传入的 UTF-8 name。
   */
  private resolveDisplayName(originalname?: string, explicitName?: string) {
    const raw = (explicitName || originalname || '').trim();
    if (!raw) return 'unnamed';
    if (/[^\u0000-\u00ff]/.test(raw)) return raw;
    try {
      const decoded = Buffer.from(raw, 'latin1').toString('utf8');
      if (!decoded || decoded.includes('\uFFFD')) return raw;
      return decoded;
    } catch {
      return raw;
    }
  }

  private uniqueName(originalname: string) {
    const ext = extname(originalname) || '';
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  }

  /** 为 PDF / 视频生成占位缩略图，便于后台网格预览 */
  private async createLabelThumbnail(
    label: string,
    baseFilename: string,
    tone: string,
  ) {
    const thumbName = `thumb-${baseFilename.replace(/\.[^.]+$/, '')}.png`;
    const thumbPath = join(this.uploadDir, thumbName);
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#1a1a1a"/>
        <rect x="48" y="48" width="304" height="304" rx="16" fill="#2a2a2a" stroke="${tone}" stroke-width="4"/>
        <text x="200" y="210" text-anchor="middle" font-family="Arial, sans-serif"
          font-size="56" font-weight="700" fill="${tone}">${label}</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(thumbPath);
    return `${this.publicBase}/uploads/${thumbName}`;
  }

  private async persistFile(
    file: Express.Multer.File,
    explicitName?: string,
  ) {
    const originalName = this.resolveDisplayName(
      file.originalname,
      explicitName,
    );
    const type = this.detectType(file.mimetype, originalName);
    let url: string;
    let thumbnailUrl: string | undefined;
    let originalUrl: string | undefined;
    let size: number | null = file.size || file.buffer?.length || null;

    if (type === AssetType.IMAGE) {
      const processed = await processImageUpload(
        file.buffer,
        this.uploadDir,
        file.mimetype,
        originalName,
      );
      url = `${this.publicBase}/uploads/${processed.displayFilename}`;
      thumbnailUrl = `${this.publicBase}/uploads/${processed.thumbFilename}`;
      originalUrl = `${this.publicBase}/uploads/${processed.originalFilename}`;
      size = processed.displaySize;
    } else {
      const filename = this.uniqueName(originalName);
      const absPath = join(this.uploadDir, filename);
      writeFileSync(absPath, file.buffer);
      url = `${this.publicBase}/uploads/${filename}`;
      if (type === AssetType.PDF) {
        thumbnailUrl = await this.createLabelThumbnail('PDF', filename, '#e60012');
      } else if (type === AssetType.VIDEO) {
        thumbnailUrl = await this.createLabelThumbnail('VIDEO', filename, '#409eff');
      } else if (
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        originalName.toLowerCase().endsWith('.zip')
      ) {
        thumbnailUrl = await this.createLabelThumbnail('ZIP', filename, '#67c23a');
      }
      size = existsSync(absPath) ? statSync(absPath).size : size;
    }

    return {
      url,
      thumbnailUrl,
      originalUrl,
      type,
      name: originalName,
      size,
    };
  }

  async upload(
    file: Express.Multer.File,
    productId?: number,
    sort = 0,
    explicitName?: string,
  ) {
    if (!file) throw new BadRequestException('未上传文件');

    const saved = await this.persistFile(file, explicitName);
    if (!productId) {
      return saved;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('产品不存在');

    const asset = await this.prisma.productAsset.create({
      data: {
        productId,
        type: saved.type,
        url: saved.url,
        thumbnailUrl: saved.thumbnailUrl,
        originalUrl: saved.originalUrl,
        name: saved.name,
        size: saved.size ?? undefined,
        sort,
      },
    });

    if (!product.coverUrl && saved.type === AssetType.IMAGE) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { coverUrl: saved.url, coverName: saved.name },
      });
    }

    return asset;
  }

  /** 批量上传：有 productId 则入库；无则只落盘返回素材信息（新建暂存） */
  async uploadMany(
    files: Express.Multer.File[],
    productId?: number,
    names?: string[],
  ) {
    if (!files?.length) throw new BadRequestException('未上传文件');

    if (!productId) {
      const list = [];
      for (let i = 0; i < files.length; i++) {
        list.push(await this.persistFile(files[i], names?.[i]));
      }
      return { count: list.length, list };
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('产品不存在');

    const existingCount = await this.prisma.productAsset.count({
      where: { productId },
    });

    const created = [];
    let coverSet = Boolean(product.coverUrl);

    for (let i = 0; i < files.length; i++) {
      const saved = await this.persistFile(files[i], names?.[i]);
      const asset = await this.prisma.productAsset.create({
        data: {
          productId,
          type: saved.type,
          url: saved.url,
          thumbnailUrl: saved.thumbnailUrl,
          originalUrl: saved.originalUrl,
          name: saved.name,
          size: saved.size ?? undefined,
          sort: existingCount + i,
        },
      });
      created.push(asset);

      if (!coverSet && saved.type === AssetType.IMAGE) {
        await this.prisma.product.update({
          where: { id: productId },
          data: { coverUrl: saved.url, coverName: saved.name },
        });
        coverSet = true;
      }
    }

    return { count: created.length, list: created };
  }

  /** 将已上传文件绑定到产品（新建场景：先上传后保存） */
  async bindMany(
    productId: number,
    items: Array<{
      url: string;
      thumbnailUrl?: string | null;
      originalUrl?: string | null;
      type?: AssetType;
      name?: string | null;
      size?: number | null;
      sort?: number;
    }>,
  ) {
    if (!productId) throw new BadRequestException('缺少 productId');
    if (!items?.length) return { count: 0, list: [] };

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('产品不存在');

    const existingCount = await this.prisma.productAsset.count({
      where: { productId },
    });

    const created = [];
    let coverSet = Boolean(product.coverUrl);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.url) continue;
      const type = item.type || AssetType.OTHER;
      const asset = await this.prisma.productAsset.create({
        data: {
          productId,
          type,
          url: item.url,
          thumbnailUrl: item.thumbnailUrl || undefined,
          originalUrl: item.originalUrl || undefined,
          name: item.name || undefined,
          size: item.size ?? undefined,
          sort: item.sort ?? existingCount + i,
        },
      });
      created.push(asset);

      if (!coverSet && type === AssetType.IMAGE) {
        await this.prisma.product.update({
          where: { id: productId },
          data: { coverUrl: item.url, coverName: item.name || undefined },
        });
        coverSet = true;
      }
    }

    return { count: created.length, list: created };
  }

  async listByProduct(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { include: { parent: true } },
        i18n: true,
        assets: { orderBy: { sort: 'asc' } },
        vehicles: { include: { vehicle: true } },
      },
    });
    if (!product) throw new NotFoundException('产品不存在');
    return serializeProduct(product);
  }

  async remove(id: number) {
    const asset = await this.prisma.productAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('素材不存在');
    await this.prisma.productAsset.delete({ where: { id } });
    return true;
  }
}
