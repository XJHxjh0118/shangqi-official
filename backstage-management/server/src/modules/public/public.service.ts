import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetType, ProductStatus } from '@prisma/client';
import { ZipArchive } from 'archiver';
import { createReadStream, existsSync } from 'fs';
import { extname, join } from 'path';
import { PassThrough } from 'stream';
import { pageResult, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { PageSeoService } from '../page-seo/page-seo.service';
import { ServicesService } from '../services/services.service';
import { SharesService } from '../shares/shares.service';
import { serializeProduct } from '../products/product-media';
import {
  CreateContactMessageDto,
  CreateInquiryDto,
  PublicProductQueryDto,
} from './dto/public.dto';

type PackSource = {
  url: string;
  name?: string | null;
  type: AssetType | 'COVER' | 'PACK';
};

@Injectable()
export class PublicService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly siteSettingsService: SiteSettingsService,
    private readonly pageSeoService: PageSeoService,
    private readonly servicesService: ServicesService,
    private readonly sharesService: SharesService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') || 'uploads';
  }

  siteSettings() {
    return this.siteSettingsService.getPublic();
  }

  /** 首页一次返回 Banner + 热门/新品/全部产品区块 + 适配车型，减少前台往返 */
  async home() {
    const [banners, hot, newer, featured, all, homeVehicles] = await Promise.all([
      this.banners(),
      this.products({ tag: 'hot', pageSize: 8 }),
      this.products({ tag: 'new', pageSize: 8 }),
      this.products({ tag: 'featured', pageSize: 8 }),
      this.products({ pageSize: 8 }),
      this.homeVehicles(),
    ]);
    return { banners, hot, newer, featured, all, homeVehicles };
  }

  banners() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        enabled: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: { i18n: true },
    });
  }

  vehicles() {
    return this.prisma.vehicle.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  async homeVehicles() {
    const rows = await this.prisma.homeVehicle.findMany({
      where: { enabled: true, vehicle: { enabled: true } },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        vehicle: true,
      },
    });
    return rows.map((row) => ({
      id: row.vehicle.id,
      code: row.vehicle.code,
      brandZh: row.vehicle.brandZh,
      brandEn: row.vehicle.brandEn,
      modelZh: row.vehicle.modelZh,
      modelEn: row.vehicle.modelEn,
      yearFrom: row.vehicle.yearFrom,
      yearTo: row.vehicle.yearTo,
      imageUrl: row.imageUrl,
      sort: row.sort,
    }));
  }

  services() {
    return this.servicesService.findPublic();
  }

  pageSeo(pageKey?: string) {
    if (pageKey) return this.pageSeoService.findByKey(pageKey);
    return this.pageSeoService.findAll();
  }

  shareByToken(token: string) {
    return this.sharesService.findPublicByToken(token);
  }

  categories() {
    return this.prisma.category.findMany({
      where: { enabled: true, parentId: null },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        i18n: true,
        children: {
          where: { enabled: true },
          orderBy: [{ sort: 'asc' }, { id: 'asc' }],
          include: { i18n: true },
        },
      },
    });
  }

  contacts() {
    return this.prisma.contactPerson.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  async products(query: PublicProductQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const { skip, take } = paginate(page, pageSize);

    const where = {
      status: ProductStatus.PUBLISHED,
      ...(query.category
        ? {
            OR: [
              { category: { code: query.category } },
              { category: { parent: { code: query.category } } },
            ],
          }
        : {}),
      ...(query.tag === 'new' ? { isNew: true } : {}),
      ...(query.tag === 'hot' ? { isHot: true } : {}),
      ...(query.tag === 'featured' ? { isFeatured: true } : {}),
      ...(query.vehicleId
        ? { vehicles: { some: { vehicleId: query.vehicleId } } }
        : {}),
      ...(query.keyword
        ? {
            OR: [
              { sku: { contains: query.keyword } },
              { slug: { contains: query.keyword } },
              { i18n: { some: { name: { contains: query.keyword } } } },
            ],
          }
        : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort: 'asc' }, { id: 'desc' }],
        include: {
          category: { include: { parent: true } },
          i18n: true,
          assets: { orderBy: { sort: 'asc' } },
          vehicles: { include: { vehicle: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return pageResult(
      list.map((row) => serializeProduct(row)),
      total,
      page,
      pageSize,
    );
  }

  async productBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: {
        category: { include: { parent: true } },
        i18n: true,
        assets: { orderBy: { sort: 'asc' } },
        vehicles: { include: { vehicle: true } },
      },
    });
    if (!product) throw new NotFoundException('产品不存在');

    const related = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        id: { not: product.id },
        categoryId: product.categoryId,
      },
      take: 6,
      include: {
        i18n: true,
        category: { include: { parent: true } },
        assets: { orderBy: { sort: 'asc' } },
      },
    });

    return serializeProduct(product, {
      related,
      hasAssetPack: this.hasDownloadablePack(product),
    });
  }

  /** 一键下载营销素材包（高清图 / 海报 / 说明书等） */
  async downloadAssetPack(slug: string): Promise<StreamableFile> {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: { assets: { orderBy: { sort: 'asc' } } },
    });
    if (!product) throw new NotFoundException('产品不存在');

    const sources = this.collectPackSources(product);
    if (!sources.length) {
      throw new NotFoundException('暂无可用营销素材包');
    }

    // 若已上传完整 zip 素材包，直接返回该文件
    const readyPack = sources.find((s) => s.type === 'PACK');
    if (readyPack && sources.length === 1) {
      const filename = this.safeFilename(product.sku, `${product.sku}-assets.zip`);
      const local = this.resolveLocalUpload(readyPack.url);
      if (local) {
        return new StreamableFile(createReadStream(local), {
          type: 'application/zip',
          disposition: `attachment; filename="${filename}"`,
        });
      }
      const remote = await this.fetchRemoteBuffer(readyPack.url);
      if (remote) {
        return new StreamableFile(remote, {
          type: 'application/zip',
          disposition: `attachment; filename="${filename}"`,
        });
      }
      throw new NotFoundException('暂无可用营销素材包');
    }

    const entries = await this.resolvePackEntries(sources, product.sku);
    if (!entries.length) {
      throw new NotFoundException('暂无可用营销素材包');
    }

    const passThrough = new PassThrough();
    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on('error', (err: Error) => {
      passThrough.destroy(err);
    });
    archive.pipe(passThrough);

    for (const entry of entries) {
      if (entry.path) {
        archive.file(entry.path, { name: entry.name });
      } else if (entry.buffer) {
        archive.append(entry.buffer, { name: entry.name });
      }
    }
    void archive.finalize();

    const filename = this.safeFilename(product.sku, `${product.sku}-assets.zip`);
    return new StreamableFile(passThrough, {
      type: 'application/zip',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  private hasDownloadablePack(product: {
    assetPackUrl?: string | null;
    coverUrl?: string | null;
    assets?: Array<{ type: AssetType; url: string }>;
  }): boolean {
    return this.collectPackSources(product).length > 0;
  }

  private isPlaceholderUrl(url?: string | null): boolean {
    if (!url) return true;
    const trimmed = url.trim();
    return !trimmed || trimmed === '#' || trimmed === '/';
  }

  private collectPackSources(product: {
    assetPackUrl?: string | null;
    coverUrl?: string | null;
    assets?: Array<{ type: AssetType; url: string; name?: string | null }>;
  }): PackSource[] {
    const sources: PackSource[] = [];

    if (!this.isPlaceholderUrl(product.assetPackUrl)) {
      sources.push({
        url: product.assetPackUrl!,
        name: 'marketing-pack.zip',
        type: 'PACK',
      });
      // 已有完整素材包时，优先只下发包，避免重复打包
      return sources;
    }

    for (const asset of product.assets || []) {
      if (this.isPlaceholderUrl(asset.url)) continue;
      // 营销包：高清图、海报(PDF/OTHER)、说明书；视频体积大且不便线下印刷，不纳入
      if (asset.type === AssetType.VIDEO) continue;
      sources.push({
        url: asset.url,
        name: asset.name,
        type: asset.type,
      });
    }

    if (
      !sources.length &&
      !this.isPlaceholderUrl(product.coverUrl)
    ) {
      sources.push({
        url: product.coverUrl!,
        name: 'cover',
        type: 'COVER',
      });
    }

    return sources;
  }

  private folderForType(type: PackSource['type']): string {
    switch (type) {
      case AssetType.IMAGE:
      case 'COVER':
        return 'images';
      case AssetType.PDF:
        return 'manuals';
      case AssetType.OTHER:
        return 'posters';
      case 'PACK':
        return '';
      default:
        return 'others';
    }
  }

  private safeFilename(sku: string, name: string): string {
    const base = (name || `${sku}-assets.zip`)
      .replace(/[^\w.\u4e00-\u9fa5-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return base || `${sku}-assets.zip`;
  }

  private resolveLocalUpload(url: string): string | null {
    try {
      const pathname = url.startsWith('http')
        ? new URL(url).pathname
        : url;
      const marker = '/uploads/';
      const idx = pathname.indexOf(marker);
      if (idx < 0) return null;
      const relative = pathname.slice(idx + marker.length);
      if (!relative || relative.includes('..')) return null;
      const abs = join(process.cwd(), this.uploadDir, relative);
      return existsSync(abs) ? abs : null;
    } catch {
      return null;
    }
  }

  private guessExt(url: string, type: PackSource['type']): string {
    try {
      const pathname = url.startsWith('http')
        ? new URL(url).pathname
        : url;
      const ext = extname(pathname).toLowerCase();
      if (ext && ext.length <= 8) return ext;
    } catch {
      /* ignore */
    }
    if (type === AssetType.PDF) return '.pdf';
    if (type === AssetType.IMAGE || type === 'COVER') return '.jpg';
    if (type === 'PACK') return '.zip';
    return '';
  }

  private async resolvePackEntries(
    sources: PackSource[],
    sku: string,
  ): Promise<Array<{ name: string; path?: string; buffer?: Buffer }>> {
    const usedNames = new Set<string>();
    const entries: Array<{ name: string; path?: string; buffer?: Buffer }> = [];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const folder = this.folderForType(source.type);
      const ext = this.guessExt(source.url, source.type);
      const rawName = source.name?.trim() || `asset-${i + 1}`;
      const withExt =
        extname(rawName) || !ext ? rawName : `${rawName}${ext}`;
      let entryName = this.safeFilename(sku, withExt);
      if (folder) entryName = `${folder}/${entryName}`;

      let unique = entryName;
      let n = 2;
      while (usedNames.has(unique.toLowerCase())) {
        const dot = entryName.lastIndexOf('.');
        unique =
          dot > 0
            ? `${entryName.slice(0, dot)}-${n}${entryName.slice(dot)}`
            : `${entryName}-${n}`;
        n += 1;
      }
      usedNames.add(unique.toLowerCase());

      const local = this.resolveLocalUpload(source.url);
      if (local) {
        entries.push({ name: unique, path: local });
        continue;
      }

      const buffer = await this.fetchRemoteBuffer(source.url);
      if (buffer) {
        entries.push({ name: unique, buffer });
      }
    }

    return entries;
  }

  private async fetchRemoteBuffer(url: string): Promise<Buffer | null> {
    try {
      const absolute = url.startsWith('http')
        ? url
        : `${this.config.get<string>('PUBLIC_BASE_URL') || 'http://localhost:3001'}${url.startsWith('/') ? '' : '/'}${url}`;
      const res = await fetch(absolute);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    } catch {
      return null;
    }
  }

  async createInquiry(dto: CreateInquiryDto, userId?: number | null) {
    if (!dto.items?.length) {
      throw new BadRequestException('请至少选择一个产品');
    }
    const productIds = dto.items.map((i) => i.productId);
    const count = await this.prisma.product.count({
      where: { id: { in: productIds }, status: ProductStatus.PUBLISHED },
    });
    if (count !== productIds.length) {
      throw new BadRequestException('存在无效产品');
    }

    return this.prisma.inquiry.create({
      data: {
        userId: userId || undefined,
        company: dto.company,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        region: dto.region,
        message: dto.message,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            note: item.note,
          })),
        },
      },
      include: { items: true },
    });
  }

  createMessage(dto: CreateContactMessageDto) {
    return this.prisma.contactMessage.create({ data: dto });
  }
}
