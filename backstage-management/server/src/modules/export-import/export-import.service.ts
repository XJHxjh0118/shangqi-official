import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ProductStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';
import { serializeProduct } from '../products/product-media';
import {
  COLUMNS,
  buildCategoryIndex,
  buildVehicleIndex,
  cellText,
  categoryLabel,
  displayHeader,
  isEmptyImportedRow,
  mapImportedRow,
  optionalText,
  parseBoolean,
  parseStatus,
  resolveCategory,
  resolveVehicle,
  splitList,
  statusLabel,
  vehicleLabel,
  writeProductWorkbook,
  yesNoLabel,
  type CategoryOption,
  type ColumnKey,
  type ProductExcelRow,
  type VehicleOption,
} from './product-excel';

export { PRODUCT_XLSX_CONTENT_TYPE } from './product-excel';

type ImportI18nRow = {
  locale: string;
  name: string;
  description: string;
  material?: string;
  size?: string;
  color?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
};

type PersistProductInput = {
  sku: string;
  slug: string;
  categoryId: number;
  status: ProductStatus;
  installLevel?: string;
  isNew: boolean;
  isHot: boolean;
  isFeatured: boolean;
  vehicleIds: number[];
  i18n: ImportI18nRow[];
};

type ParsedImportItem = PersistProductInput & {
  existingId: number | null;
  category: CategoryOption;
  vehicles: VehicleOption[];
};

const PREVIEW_TTL_MS = 30 * 60 * 1000;

const productInclude = {
  category: { include: { parent: true } },
  i18n: true,
  assets: { orderBy: { sort: 'asc' as const } },
  vehicles: { include: { vehicle: true } },
};

function rowLabel(sheetRow: number) {
  return `第 ${sheetRow} 行`;
}

function pickDataSheet(book: XLSX.WorkBook) {
  const preferred = book.SheetNames.find(
    (name) => name === '产品' || name.toLowerCase() === 'products',
  );
  return book.Sheets[preferred || book.SheetNames[0]];
}

@Injectable()
export class ExportImportService {
  private readonly previews = new Map<
    string,
    { items: ParsedImportItem[]; expiresAt: number; confirming?: boolean }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async exportProducts(ids: number[]) {
    if (!ids.length) {
      throw new BadRequestException('请选择要导出的产品');
    }
    const [products, options] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: ids } },
        include: productInclude,
        orderBy: { id: 'asc' },
      }),
      this.loadOptions(),
    ]);
    if (!products.length) {
      throw new BadRequestException('未找到要导出的产品');
    }
    products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    const rows = products.map((product) => this.toExcelRow(product));
    return writeProductWorkbook({
      rows,
      categories: options.categories,
      vehicles: options.vehicles,
    });
  }

  async buildTemplate() {
    const options = await this.loadOptions();
    return writeProductWorkbook({
      rows: [],
      categories: options.categories,
      vehicles: options.vehicles,
    });
  }

  async previewImport(buffer?: Buffer) {
    const { items, errors } = await this.parseImport(buffer);
    const created = items.filter((item) => !item.existingId).length;
    const updated = items.filter((item) => item.existingId).length;

    if (!created && !updated && !errors.length) {
      throw new BadRequestException('Excel 中没有可导入的产品数据');
    }
    if (!created && !updated && errors.length) {
      throw new BadRequestException(
        `导入失败，共 ${errors.length} 条未通过校验：${errors.join('；')}`,
      );
    }

    const previewId = this.savePreview(items);

    return {
      previewId,
      created,
      updated,
      failed: errors.length,
      errors,
      list: items.map((item) => this.toPreviewRow(item)),
    };
  }

  async confirmImport(previewId: string, skus: string[]) {
    const entry = this.getPreview(previewId);
    if (entry.confirming) {
      throw new BadRequestException('正在导入中，请稍候');
    }
    const skuSet = new Set(skus.map((sku) => sku.trim()).filter(Boolean));
    const items = entry.items.filter((item) => skuSet.has(item.sku));
    if (!items.length) {
      throw new BadRequestException('没有可导入的产品');
    }

    entry.confirming = true;
    const options = await this.loadOptions();
    const categoryById = new Map(options.categories.map((item) => [item.id, item]));
    const vehicleById = new Map(options.vehicles.map((item) => [item.id, item]));
    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    const successIds: number[] = [];

    try {
      for (const [index, item] of items.entries()) {
        const rowNo = index + 1;
        try {
          if (!categoryById.has(item.categoryId)) {
            throw new Error('分类不存在，请重新导入 Excel');
          }
          const missingVehicles = item.vehicleIds.filter(
            (id) => !vehicleById.has(id),
          );
          if (missingVehicles.length) {
            throw new Error('部分适配车型不存在，请重新导入 Excel');
          }

          const existing = await this.prisma.product.findUnique({
            where: { sku: item.sku },
          });
          const slugOwner = await this.prisma.product.findUnique({
            where: { slug: item.slug },
          });
          if (slugOwner && slugOwner.id !== existing?.id) {
            throw new Error(`Slug「${item.slug}」已被其他产品占用`);
          }

          const saved = await this.persistProduct(item, existing?.id ?? null);
          if (existing) updated += 1;
          else created += 1;
          successIds.push(saved.id);
        } catch (error) {
          errors.push(`第 ${rowNo} 条：${this.formatRowError(error)}`);
        }
      }

      if (!created && !updated && errors.length) {
        throw new BadRequestException(
          `导入失败，共 ${errors.length} 条未通过校验：${errors.join('；')}`,
        );
      }

      this.previews.delete(previewId);

      const list = successIds.length
        ? (
            await this.prisma.product.findMany({
              where: { id: { in: successIds } },
              include: productInclude,
            })
          )
            .sort((a, b) => successIds.indexOf(a.id) - successIds.indexOf(b.id))
            .map((row) => serializeProduct(row))
        : [];

      return {
        created,
        updated,
        failed: errors.length,
        errors,
        list,
      };
    } finally {
      if (this.previews.has(previewId)) entry.confirming = false;
    }
  }

  async removeImported(id: number) {
    const found = await this.prisma.product.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('产品不存在');
    await this.prisma.product.delete({ where: { id } });
    return true;
  }

  private async parseImport(buffer?: Buffer): Promise<{
    items: ParsedImportItem[];
    errors: string[];
  }> {
    if (!buffer?.length) {
      throw new BadRequestException('请上传 Excel 文件（.xlsx / .xls）');
    }

    let book: XLSX.WorkBook;
    try {
      book = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException(
        '无法解析 Excel 文件，请下载最新模板后重新填写导入',
      );
    }

    if (!book.SheetNames?.length) {
      throw new BadRequestException('Excel 文件为空，请使用下载的导入模板');
    }

    const sheet = pickDataSheet(book);
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });
    if (!rawRows.length) {
      throw new BadRequestException(
        'Excel 中没有可导入的产品数据。请在「产品」工作表从第 2 行开始填写',
      );
    }

    const mappedRows = rawRows.map((row, index) => ({
      sheetRow: index + 2,
      values: mapImportedRow(row),
    }));

    const presentKeys = new Set<ColumnKey>();
    for (const item of mappedRows) {
      for (const key of Object.keys(item.values) as ColumnKey[]) {
        presentKeys.add(key);
      }
    }
    const missingRequired = COLUMNS.filter(
      (col) => col.required && !presentKeys.has(col.key),
    );
    if (missingRequired.length) {
      throw new BadRequestException(
        `模板缺少必填列：${missingRequired.map((col) => displayHeader(col)).join('、')}。请下载最新 Excel 模板后重试`,
      );
    }

    const options = await this.loadOptions();
    const categoryIndex = buildCategoryIndex(options.categories);
    const vehicleIndex = buildVehicleIndex(options.vehicles);
    const skuSeen = new Map<string, number>();
    const slugSeen = new Map<string, number>();
    const items: ParsedImportItem[] = [];
    const errors: string[] = [];

    for (const item of mappedRows) {
      const { sheetRow, values } = item;
      if (isEmptyImportedRow(values)) continue;
      try {
        const sku = cellText(values.sku);
        const slug = cellText(values.slug);
        const categoryRaw = cellText(values.category);
        const nameZh = cellText(values.nameZh);
        const nameEn = cellText(values.nameEn);
        const missing: string[] = [];
        if (!sku) missing.push('SKU');
        if (!slug) missing.push('Slug');
        if (!categoryRaw) missing.push('分类');
        if (!nameZh) missing.push('中文名');
        if (!nameEn) missing.push('英文名');
        if (missing.length) {
          throw new Error(`缺少必填字段：${missing.join('、')}`);
        }

        const skuKey = sku.toLowerCase();
        const slugKey = slug.toLowerCase();
        if (skuSeen.has(skuKey)) {
          throw new Error(`SKU「${sku}」与${rowLabel(skuSeen.get(skuKey)!)}重复`);
        }
        if (slugSeen.has(slugKey)) {
          throw new Error(`Slug「${slug}」与${rowLabel(slugSeen.get(slugKey)!)}重复`);
        }
        skuSeen.set(skuKey, sheetRow);
        slugSeen.set(slugKey, sheetRow);

        const category = resolveCategory(categoryRaw, categoryIndex);
        if (!category) {
          throw new Error(
            `分类「${categoryRaw}」不存在，请从下拉列表中选择`,
          );
        }

        const vehicleTokens = splitList(values.vehicles);
        const vehicles: VehicleOption[] = [];
        const missingVehicles: string[] = [];
        for (const token of vehicleTokens) {
          const vehicle = resolveVehicle(token, vehicleIndex);
          if (!vehicle) {
            missingVehicles.push(token);
            continue;
          }
          if (!vehicles.some((item) => item.id === vehicle.id)) {
            vehicles.push(vehicle);
          }
        }
        if (missingVehicles.length) {
          throw new Error(
            `适配车型不存在：${missingVehicles.join('、')}，请从下拉列表中选择`,
          );
        }

        const existing = await this.prisma.product.findUnique({
          where: { sku },
        });
        const slugOwner = await this.prisma.product.findUnique({
          where: { slug },
        });
        if (slugOwner && slugOwner.id !== existing?.id) {
          throw new Error(`Slug「${slug}」已被其他产品占用`);
        }

        items.push({
          sku,
          slug,
          categoryId: category.id,
          status: parseStatus(values.status),
          installLevel: optionalText(values.installLevel),
          isNew: parseBoolean(values.isNew, '新品'),
          isHot: parseBoolean(values.isHot, '热销'),
          isFeatured: parseBoolean(values.isFeatured, '首页主推'),
          vehicleIds: vehicles.map((item) => item.id),
          i18n: [
            {
              locale: 'zh',
              name: nameZh,
              description: cellText(values.descriptionZh),
              material: optionalText(values.materialZh),
              size: optionalText(values.sizeZh),
              color: optionalText(values.colorZh),
              seoTitle: optionalText(values.seoTitleZh),
              seoKeywords: optionalText(values.seoKeywordsZh),
              seoDescription: optionalText(values.seoDescriptionZh),
            },
            {
              locale: 'en',
              name: nameEn,
              description: cellText(values.descriptionEn),
              material: optionalText(values.materialEn),
              size: optionalText(values.sizeEn),
              color: optionalText(values.colorEn),
              seoTitle: optionalText(values.seoTitleEn),
              seoKeywords: optionalText(values.seoKeywordsEn),
              seoDescription: optionalText(values.seoDescriptionEn),
            },
          ],
          existingId: existing?.id ?? null,
          category,
          vehicles,
        });
      } catch (error) {
        errors.push(`${rowLabel(sheetRow)}：${this.formatRowError(error)}`);
      }
    }

    return { items, errors };
  }

  private toPreviewRow(item: ParsedImportItem) {
    const zh = item.i18n.find((row) => row.locale === 'zh');
    const en = item.i18n.find((row) => row.locale === 'en');
    return {
      sku: item.sku,
      slug: item.slug,
      status: item.status,
      action: item.existingId ? 'update' : 'create',
      category: {
        nameZh: item.category.nameZh,
        parent: item.category.parent,
      },
      i18n: {
        zh: { name: zh?.name || '' },
        en: { name: en?.name || '' },
      },
      vehicles: item.vehicles.map((vehicle) => ({
        id: vehicle.id,
        code: vehicle.code,
        brandZh: vehicle.brandZh,
        modelZh: vehicle.modelZh,
        yearFrom: vehicle.yearFrom,
        yearTo: vehicle.yearTo,
      })),
    };
  }

  private savePreview(items: ParsedImportItem[]) {
    this.purgePreviews();
    const previewId = randomUUID();
    this.previews.set(previewId, {
      items,
      expiresAt: Date.now() + PREVIEW_TTL_MS,
    });
    return previewId;
  }

  private getPreview(previewId: string) {
    this.purgePreviews();
    const entry = this.previews.get(previewId);
    if (!entry) {
      throw new BadRequestException('导入预览已过期，请重新导入 Excel');
    }
    return entry;
  }

  private purgePreviews() {
    const now = Date.now();
    for (const [id, entry] of this.previews) {
      if (entry.expiresAt <= now) this.previews.delete(id);
    }
  }

  private persistProduct(item: PersistProductInput, existingId: number | null) {
    const data = {
      sku: item.sku,
      slug: item.slug,
      categoryId: item.categoryId,
      status: item.status,
      installLevel: item.installLevel,
      isNew: item.isNew,
      isHot: item.isHot,
      isFeatured: item.isFeatured,
    };
    const i18n = item.i18n;
    const vehicleIds = item.vehicleIds;

    return this.prisma.$transaction(async (tx) => {
      if (existingId) {
        await tx.productI18n.deleteMany({ where: { productId: existingId } });
        await tx.productVehicle.deleteMany({
          where: { productId: existingId },
        });
        return tx.product.update({
          where: { id: existingId },
          data: {
            ...data,
            i18n: { create: i18n },
            ...(vehicleIds.length
              ? {
                  vehicles: {
                    create: vehicleIds.map((vehicleId) => ({ vehicleId })),
                  },
                }
              : {}),
          },
        });
      }
      return tx.product.create({
        data: {
          ...data,
          i18n: { create: i18n },
          ...(vehicleIds.length
            ? {
                vehicles: {
                  create: vehicleIds.map((vehicleId) => ({ vehicleId })),
                },
              }
            : {}),
        },
      });
    });
  }

  private async loadOptions(): Promise<{
    categories: CategoryOption[];
    vehicles: VehicleOption[];
  }> {
    const [categories, vehicles] = await Promise.all([
      this.prisma.category.findMany({
        include: { parent: true },
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.vehicle.findMany({
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return {
      categories: categories.map((item) => ({
        id: item.id,
        code: item.code,
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        enabled: item.enabled,
        parent: item.parent
          ? { code: item.parent.code, nameZh: item.parent.nameZh }
          : null,
      })),
      vehicles: vehicles.map((item) => ({
        id: item.id,
        code: item.code,
        brandZh: item.brandZh,
        modelZh: item.modelZh,
        yearFrom: item.yearFrom,
        yearTo: item.yearTo,
        enabled: item.enabled,
      })),
    };
  }

  private toExcelRow(product: {
    sku: string;
    slug: string;
    status: string;
    installLevel: string | null;
    isNew: boolean;
    isHot: boolean;
    isFeatured: boolean;
    category?: {
      code: string;
      nameZh: string;
      enabled: boolean;
      parent?: { code: string; nameZh: string } | null;
    } | null;
    i18n?: Array<{
      locale: string;
      name: string;
      description: string;
      material?: string | null;
      size?: string | null;
      color?: string | null;
      seoTitle?: string | null;
      seoKeywords?: string | null;
      seoDescription?: string | null;
    }>;
    vehicles?: Array<{
      vehicle?: {
        id: number;
        code: string;
        brandZh: string;
        modelZh: string;
        yearFrom: number | null;
        yearTo: number | null;
        enabled: boolean;
      } | null;
    }>;
  }): ProductExcelRow {
    const zh = product.i18n?.find((item) => item.locale === 'zh');
    const en = product.i18n?.find((item) => item.locale === 'en');
    const category = product.category
      ? categoryLabel({
          id: 0,
          code: product.category.code,
          nameZh: product.category.nameZh,
          nameEn: '',
          enabled: product.category.enabled,
          parent: product.category.parent,
        })
      : '';
    const vehicleLabels = (product.vehicles || [])
      .map((bind) => bind.vehicle)
      .filter(Boolean)
      .map((item) => vehicleLabel(item as VehicleOption));
    return {
      sku: product.sku,
      slug: product.slug,
      category,
      nameZh: zh?.name || '',
      nameEn: en?.name || '',
      status: statusLabel(product.status),
      installLevel: product.installLevel || '',
      isNew: yesNoLabel(product.isNew),
      isHot: yesNoLabel(product.isHot),
      isFeatured: yesNoLabel(product.isFeatured),
      descriptionZh: zh?.description || '',
      descriptionEn: en?.description || '',
      materialZh: zh?.material || '',
      materialEn: en?.material || '',
      sizeZh: zh?.size || '',
      sizeEn: en?.size || '',
      colorZh: zh?.color || '',
      colorEn: en?.color || '',
      seoTitleZh: zh?.seoTitle || '',
      seoTitleEn: en?.seoTitle || '',
      seoKeywordsZh: zh?.seoKeywords || '',
      seoKeywordsEn: en?.seoKeywords || '',
      seoDescriptionZh: zh?.seoDescription || '',
      seoDescriptionEn: en?.seoDescription || '',
      vehicleLabels,
    };
  }

  private formatRowError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return 'SKU 或 Slug 已存在';
      return '保存失败，请检查该行数据';
    }
    if (error instanceof Error && error.message) return error.message;
    return '导入失败';
  }
}
