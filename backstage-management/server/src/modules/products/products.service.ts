import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageResult, paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { assertRequiredLocales } from '../../common/i18n.util';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
  BatchProductDto,
} from './dto/product.dto';
import { serializeProduct } from './product-media';
import {
  buildProductSlugBase,
  resolveUniqueProductSlug,
  slugify,
} from '../../common/slug.util';

const productInclude = {
  category: { include: { parent: true } },
  i18n: true,
  assets: { orderBy: { sort: 'asc' as const } },
  vehicles: { include: { vehicle: true } },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { skip, take } = paginate(page, pageSize);

    const categoryIds = query.categoryId
      ? await this.collectCategoryIds(query.categoryId)
      : [];

    const where: Prisma.ProductWhereInput = {
      ...(categoryIds.length ? { categoryId: { in: categoryIds } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(typeof query.isNew === 'boolean' ? { isNew: query.isNew } : {}),
      ...(typeof query.isHot === 'boolean' ? { isHot: query.isHot } : {}),
      ...(typeof query.isFeatured === 'boolean'
        ? { isFeatured: query.isFeatured }
        : {}),
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
        include: productInclude,
      }),
      this.prisma.product.count({ where }),
    ]);
    return pageResult(list.map((row) => serializeProduct(row)), total, page, pageSize);
  }

  async findOne(id: number) {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!row) throw new NotFoundException('产品不存在');
    return serializeProduct(row);
  }

  async create(dto: CreateProductDto) {
    const { i18n, vehicleIds, slug: inputSlug, ...rest } = dto;
    assertRequiredLocales(i18n, '名称');
    const enName = i18n.find((item) => item.locale === 'en')?.name;
    const slugBase = inputSlug?.trim()
      ? slugify(inputSlug)
      : buildProductSlugBase(rest.sku, enName);
    if (!slugBase) {
      throw new BadRequestException('无法生成 URL 别名，请检查 SKU');
    }
    const slug = await resolveUniqueProductSlug(this.prisma, slugBase);
    await this.ensureUnique(rest.sku, slug);
    return this.prisma.product.create({
      data: {
        ...rest,
        slug,
        i18n: { create: i18n },
        ...(vehicleIds?.length
          ? {
              vehicles: {
                create: vehicleIds.map((vehicleId) => ({ vehicleId })),
              },
            }
          : {}),
      },
      include: productInclude,
    }).then((row) => serializeProduct(row));
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.sku || dto.slug) {
      await this.ensureUnique(dto.sku, dto.slug, id);
    }

    const { i18n, vehicleIds, ...rest } = dto;
    if (i18n) {
      assertRequiredLocales(i18n, '名称');
    }
    return this.prisma.$transaction(async (tx) => {
      if (i18n) {
        await tx.productI18n.deleteMany({ where: { productId: id } });
        await tx.productI18n.createMany({
          data: i18n.map((item) => ({ ...item, productId: id })),
        });
      }
      if (vehicleIds) {
        await tx.productVehicle.deleteMany({ where: { productId: id } });
        if (vehicleIds.length) {
          await tx.productVehicle.createMany({
            data: vehicleIds.map((vehicleId) => ({ productId: id, vehicleId })),
          });
        }
      }
      return tx.product.update({
        where: { id },
        data: rest,
        include: productInclude,
      }).then((row) => serializeProduct(row));
    });
  }

  async batchUpdate(dto: BatchProductDto) {
    if (!dto.ids.length) throw new BadRequestException('请选择产品');
    const data: Prisma.ProductUpdateManyMutationInput = {
      ...(dto.status != null ? { status: dto.status } : {}),
      ...(typeof dto.isNew === 'boolean' ? { isNew: dto.isNew } : {}),
      ...(typeof dto.isHot === 'boolean' ? { isHot: dto.isHot } : {}),
      ...(typeof dto.isFeatured === 'boolean'
        ? { isFeatured: dto.isFeatured }
        : {}),
    };
    if (!Object.keys(data).length) {
      throw new BadRequestException('请指定要批量修改的字段');
    }
    const result = await this.prisma.product.updateMany({
      where: { id: { in: dto.ids } },
      data,
    });
    return { count: result.count };
  }

  async batchRemove(ids: number[]) {
    if (!ids.length) throw new BadRequestException('请选择产品');
    await this.prisma.$transaction([
      this.prisma.inquiryItem.deleteMany({ where: { productId: { in: ids } } }),
      this.prisma.product.deleteMany({ where: { id: { in: ids } } }),
    ]);
    return true;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return true;
  }

  private async collectCategoryIds(categoryId: number) {
    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    return [categoryId, ...children.map((item) => item.id)];
  }

  private async ensureUnique(sku?: string, slug?: string, excludeId?: number) {
    if (sku) {
      const found = await this.prisma.product.findFirst({
        where: { sku, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      });
      if (found) throw new BadRequestException('SKU 已存在');
    }
    if (slug) {
      const found = await this.prisma.product.findFirst({
        where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      });
      if (found) throw new BadRequestException('Slug 已存在');
    }
  }
}
