import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertRequiredLocales,
  resolveTitleI18n,
  syncTitleZhEn,
} from '../../common/i18n.util';
import { parseOptionalDate } from '../../common/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.banner.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
      include: { i18n: true },
    });
  }

  async create(dto: CreateBannerDto) {
    const i18n = resolveTitleI18n(dto);
    assertRequiredLocales(i18n, '标题');
    const { titleZh, titleEn } = syncTitleZhEn(i18n);
    const { i18n: _i18n, titleZh: _zh, titleEn: _en, startAt, endAt, ...rest } =
      dto;

    return this.prisma.banner.create({
      data: {
        ...rest,
        startAt: parseOptionalDate(startAt),
        endAt: parseOptionalDate(endAt),
        titleZh,
        titleEn,
        i18n: { create: i18n },
      },
      include: { i18n: true },
    });
  }

  async update(id: number, dto: UpdateBannerDto) {
    await this.ensureExists(id);
    const {
      i18n: i18nInput,
      titleZh: _zh,
      titleEn: _en,
      startAt,
      endAt,
      ...rest
    } = dto;
    const schedule =
      startAt !== undefined || endAt !== undefined
        ? {
            ...(startAt !== undefined
              ? { startAt: parseOptionalDate(startAt) }
              : {}),
            ...(endAt !== undefined ? { endAt: parseOptionalDate(endAt) } : {}),
          }
        : {};
    const hasI18nPayload =
      i18nInput !== undefined ||
      dto.titleZh !== undefined ||
      dto.titleEn !== undefined;

    return this.prisma.$transaction(async (tx) => {
      if (hasI18nPayload) {
        const i18n = resolveTitleI18n({
          i18n: i18nInput,
          titleZh: dto.titleZh,
          titleEn: dto.titleEn,
        });
        assertRequiredLocales(i18n, '标题');
        const { titleZh, titleEn } = syncTitleZhEn(i18n);
        await tx.bannerI18n.deleteMany({ where: { bannerId: id } });
        await tx.bannerI18n.createMany({
          data: i18n.map((item) => ({ ...item, bannerId: id })),
        });
        return tx.banner.update({
          where: { id },
          data: { ...rest, ...schedule, titleZh, titleEn },
          include: { i18n: true },
        });
      }
      return tx.banner.update({
        where: { id },
        data: { ...rest, ...schedule },
        include: { i18n: true },
      });
    });
  }

  async reorder(ids: number[]) {
    if (!ids?.length) throw new BadRequestException('请传入 Banner 排序');

    const rows = await this.prisma.banner.findMany({ select: { id: true } });
    const allIds = new Set(rows.map((item) => item.id));
    if (ids.length !== rows.length || ids.some((id) => !allIds.has(id))) {
      throw new BadRequestException('Banner 排序数据不正确');
    }

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.banner.update({
          where: { id },
          data: { sort: index },
        }),
      ),
    );
    return true;
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.banner.delete({ where: { id } });
    return true;
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.banner.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Banner 不存在');
    return row;
  }
}
