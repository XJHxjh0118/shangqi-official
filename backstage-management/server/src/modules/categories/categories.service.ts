import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertRequiredLocales,
  resolveNameI18n,
  syncNameZhEn,
} from '../../common/i18n.util';
import {
  CreateCategoryDto,
  NestedChildCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

const categoryInclude = {
  i18n: true,
  children: {
    orderBy: [{ sort: 'asc' as const }, { id: 'asc' as const }],
    include: { i18n: true },
  },
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: categoryInclude,
      where: { parentId: null },
    });
  }

  findFlat() {
    return this.prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: { i18n: true },
    });
  }

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new BadRequestException('分类编码已存在');
    await this.ensureParentAllowsChild(dto.parentId);
    if (dto.parentId && dto.children?.length) {
      throw new BadRequestException('子分类下不能再创建子分类');
    }

    const i18n = resolveNameI18n(dto);
    assertRequiredLocales(i18n, '名称');
    const { nameZh, nameEn } = syncNameZhEn(i18n);
    const { i18n: _i18n, nameZh: _zh, nameEn: _en, children, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      const parent = await tx.category.create({
        data: {
          ...rest,
          nameZh,
          nameEn,
          i18n: { create: i18n },
        },
      });
      if (children?.length) {
        await this.syncChildren(tx, parent.id, children);
      }
      return tx.category.findUnique({
        where: { id: parent.id },
        include: categoryInclude,
      });
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const current = await this.ensureExists(id);
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('不能将自身设为父级');
      }
      await this.ensureParentAllowsChild(dto.parentId);
      if (dto.parentId != null) {
        const childCount = await this.prisma.category.count({
          where: { parentId: id },
        });
        if (childCount > 0) {
          throw new BadRequestException('该分类下仍有子分类，不能再设父级');
        }
      }
    }

    const { i18n: i18nInput, nameZh: _zh, nameEn: _en, children, ...rest } =
      dto;
    if (children?.length) {
      const nextParentId =
        dto.parentId !== undefined ? dto.parentId : current.parentId;
      if (nextParentId != null) {
        throw new BadRequestException('子分类下不能再创建子分类');
      }
    }
    const hasI18nPayload =
      i18nInput !== undefined ||
      dto.nameZh !== undefined ||
      dto.nameEn !== undefined;

    return this.prisma.$transaction(async (tx) => {
      if (hasI18nPayload) {
        const i18n = resolveNameI18n({
          i18n: i18nInput,
          nameZh: dto.nameZh,
          nameEn: dto.nameEn,
        });
        assertRequiredLocales(i18n, '名称');
        const { nameZh, nameEn } = syncNameZhEn(i18n);
        await tx.categoryI18n.deleteMany({ where: { categoryId: id } });
        await tx.categoryI18n.createMany({
          data: i18n.map((item) => ({ ...item, categoryId: id })),
        });
        await tx.category.update({
          where: { id },
          data: { ...rest, nameZh, nameEn },
        });
      } else {
        await tx.category.update({
          where: { id },
          data: rest,
        });
      }
      if (children) {
        await this.syncChildren(tx, id, children);
      }
      return tx.category.findUnique({
        where: { id },
        include: categoryInclude,
      });
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    const childCount = await this.prisma.category.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException('该主分类下仍有子分类，无法删除');
    }
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new BadRequestException('分类下仍有产品，无法删除');
    }
    await this.prisma.category.delete({ where: { id } });
    return true;
  }

  async reorderChildren(parentId: number, ids: number[]) {
    await this.ensureExists(parentId);
    if (!ids?.length) throw new BadRequestException('请传入子分类排序');

    const children = await this.prisma.category.findMany({
      where: { parentId },
      select: { id: true },
    });
    const childIds = new Set(children.map((item) => item.id));
    if (
      ids.length !== children.length ||
      ids.some((id) => !childIds.has(id))
    ) {
      throw new BadRequestException('子分类排序数据不正确');
    }

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { sort: index },
        }),
      ),
    );
    return true;
  }

  private async syncChildren(
    tx: Prisma.TransactionClient,
    parentId: number,
    children: NestedChildCategoryDto[],
  ) {
    const parent = await tx.category.findUnique({ where: { id: parentId } });
    if (!parent) throw new BadRequestException('父级分类不存在');
    if (parent.parentId != null) {
      throw new BadRequestException('仅支持两级分类，不能挂在子分类下');
    }

    const codes = children.map((item) => item.code.trim());
    if (codes.some((code) => !code)) {
      throw new BadRequestException('子分类编码不能为空');
    }
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException('子分类编码不能重复');
    }

    const existing = await tx.category.findMany({
      where: { parentId },
      select: { id: true, nameZh: true },
    });
    const existingIds = new Set(existing.map((item) => item.id));
    const incomingIds = new Set(
      children.map((item) => item.id).filter((id): id is number => !!id),
    );

    for (const child of children) {
      if (child.id && !existingIds.has(child.id)) {
        throw new BadRequestException('子分类不属于该主分类');
      }
      const found = await tx.category.findUnique({
        where: { code: child.code.trim() },
      });
      if (found && found.id !== child.id) {
        throw new BadRequestException(`分类编码已存在：${child.code}`);
      }
    }

    for (const row of existing) {
      if (incomingIds.has(row.id)) continue;
      const productCount = await tx.product.count({
        where: { categoryId: row.id },
      });
      if (productCount > 0) {
        throw new BadRequestException(
          `子分类「${row.nameZh}」下仍有产品，无法删除`,
        );
      }
      await tx.category.delete({ where: { id: row.id } });
    }

    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      const i18n = resolveNameI18n(child);
      assertRequiredLocales(i18n, '名称');
      const { nameZh, nameEn } = syncNameZhEn(i18n);
      const enabled = child.enabled ?? true;
      const code = child.code.trim();

      if (child.id) {
        await tx.categoryI18n.deleteMany({ where: { categoryId: child.id } });
        await tx.categoryI18n.createMany({
          data: i18n.map((item) => ({ ...item, categoryId: child.id! })),
        });
        await tx.category.update({
          where: { id: child.id },
          data: {
            code,
            nameZh,
            nameEn,
            enabled,
            sort: index,
            parentId,
          },
        });
      } else {
        await tx.category.create({
          data: {
            code,
            nameZh,
            nameEn,
            enabled,
            sort: index,
            parentId,
            i18n: { create: i18n },
          },
        });
      }
    }
  }

  private async ensureParentAllowsChild(parentId?: number | null) {
    if (parentId == null) return;
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) throw new BadRequestException('父级分类不存在');
    if (parent.parentId != null) {
      throw new BadRequestException('仅支持两级分类，不能挂在子分类下');
    }
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('分类不存在');
    return row;
  }
}
