import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { parseOptionalDate } from '../../common/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { SYSTEM_ROLE } from '../../common/system-role';
import { serializeProduct } from '../products/product-media';
import { CreateShareLinkDto, UpdateShareLinkDto } from './dto/share.dto';

type Actor = { id: number; role: string };

@Injectable()
export class SharesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(actor: Actor) {
    return this.prisma.shareLink.findMany({
      where: actor.role === SYSTEM_ROLE.DEALER ? { createdById: actor.id } : {},
      orderBy: { id: 'desc' },
      include: { createdBy: { select: { id: true, username: true, nickname: true } } },
    });
  }

  async create(actor: Actor, dto: CreateShareLinkDto) {
    await this.ensureProducts(dto.productIds);
    return this.prisma.shareLink.create({
      data: {
        token: randomBytes(12).toString('hex'),
        title: dto.title,
        createdById: actor.id,
        productIds: JSON.stringify(dto.productIds),
        expiresAt: parseOptionalDate(dto.expiresAt),
        enabled: dto.enabled ?? true,
      },
    });
  }

  async update(actor: Actor, id: number, dto: UpdateShareLinkDto) {
    const row = await this.ensureOwned(actor, id);
    if (dto.productIds) await this.ensureProducts(dto.productIds);
    return this.prisma.shareLink.update({
      where: { id },
      data: {
        title: dto.title,
        enabled: dto.enabled,
        productIds:
          dto.productIds != null
            ? JSON.stringify(dto.productIds)
            : row.productIds,
        expiresAt:
          dto.expiresAt !== undefined
            ? parseOptionalDate(dto.expiresAt)
            : undefined,
      },
    });
  }

  async remove(actor: Actor, id: number) {
    await this.ensureOwned(actor, id);
    await this.prisma.shareLink.delete({ where: { id } });
    return true;
  }

  async findPublicByToken(token: string) {
    const row = await this.prisma.shareLink.findUnique({ where: { token } });
    if (!row || !row.enabled) throw new NotFoundException('分享链接不存在');
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('分享链接已过期');
    }
    const ids = this.parseIds(row.productIds);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, status: ProductStatus.PUBLISHED },
      include: {
        category: { include: { parent: true } },
        i18n: true,
        assets: { orderBy: { sort: 'asc' } },
        vehicles: { include: { vehicle: true } },
      },
    });
    const order = new Map(ids.map((id, index) => [id, index]));
    products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return {
      title: row.title,
      expiresAt: row.expiresAt,
      products: products.map((item) => serializeProduct(item)),
    };
  }

  private parseIds(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id))
        : [];
    } catch {
      return [];
    }
  }

  private async ensureProducts(ids: number[]) {
    const count = await this.prisma.product.count({
      where: { id: { in: ids } },
    });
    if (count !== ids.length) {
      throw new NotFoundException('存在无效产品');
    }
  }

  private async ensureOwned(actor: Actor, id: number) {
    const row = await this.prisma.shareLink.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('分享链接不存在');
    if (actor.role === SYSTEM_ROLE.DEALER && row.createdById !== actor.id) {
      throw new ForbiddenException('只能操作自己的分享链接');
    }
    return row;
  }
}
