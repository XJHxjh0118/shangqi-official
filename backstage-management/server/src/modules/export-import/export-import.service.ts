import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportImportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        i18n: true,
      },
      orderBy: { id: 'asc' },
    });

    const rows = products.map((p) => {
      const zh = p.i18n.find((i) => i.locale === 'zh');
      const en = p.i18n.find((i) => i.locale === 'en');
      return {
        sku: p.sku,
        slug: p.slug,
        category: p.category.code,
        status: p.status,
        isNew: p.isNew ? 1 : 0,
        isHot: p.isHot ? 1 : 0,
        nameZh: zh?.name || '',
        nameEn: en?.name || '',
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
        installLevel: p.installLevel || '',
        coverUrl: p.coverUrl || '',
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'products');
    return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async importProducts(buffer: Buffer) {
    const book = XLSX.read(buffer, { type: 'buffer' });
    const sheet = book.Sheets[book.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const sku = String(row.sku || '').trim();
        const slug = String(row.slug || '').trim();
        const categoryCode = String(row.category || '').trim();
        if (!sku || !slug || !categoryCode) {
          throw new Error('sku/slug/category 必填');
        }

        const category = await this.prisma.category.findUnique({
          where: { code: categoryCode },
        });
        if (!category) throw new Error(`分类不存在: ${categoryCode}`);

        const data = {
          sku,
          slug,
          categoryId: category.id,
          isNew: Number(row.isNew) === 1,
          isHot: Number(row.isHot) === 1,
          installLevel: row.installLevel ? String(row.installLevel) : undefined,
          coverUrl: row.coverUrl ? String(row.coverUrl) : undefined,
          status: (String(row.status || 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'),
        };

        const i18n = [
          {
            locale: 'zh',
            name: String(row.nameZh || sku),
            description: String(row.descriptionZh || ''),
            material: row.materialZh ? String(row.materialZh) : undefined,
            size: row.sizeZh ? String(row.sizeZh) : undefined,
            color: row.colorZh ? String(row.colorZh) : undefined,
            seoTitle: row.seoTitleZh ? String(row.seoTitleZh) : undefined,
            seoKeywords: row.seoKeywordsZh ? String(row.seoKeywordsZh) : undefined,
            seoDescription: row.seoDescriptionZh
              ? String(row.seoDescriptionZh)
              : undefined,
          },
          {
            locale: 'en',
            name: String(row.nameEn || sku),
            description: String(row.descriptionEn || ''),
            material: row.materialEn ? String(row.materialEn) : undefined,
            size: row.sizeEn ? String(row.sizeEn) : undefined,
            color: row.colorEn ? String(row.colorEn) : undefined,
            seoTitle: row.seoTitleEn ? String(row.seoTitleEn) : undefined,
            seoKeywords: row.seoKeywordsEn ? String(row.seoKeywordsEn) : undefined,
            seoDescription: row.seoDescriptionEn
              ? String(row.seoDescriptionEn)
              : undefined,
          },
        ];

        const exists = await this.prisma.product.findUnique({ where: { sku } });
        if (exists) {
          await this.prisma.$transaction(async (tx) => {
            await tx.productI18n.deleteMany({ where: { productId: exists.id } });
            await tx.product.update({
              where: { id: exists.id },
              data: {
                ...data,
                i18n: { create: i18n },
              },
            });
          });
          updated += 1;
        } else {
          await this.prisma.product.create({
            data: {
              ...data,
              i18n: { create: i18n },
            },
          });
          created += 1;
        }
      } catch (e) {
        errors.push(`第 ${index + 2} 行: ${(e as Error).message}`);
      }
    }

    return { created, updated, errors };
  }
}
