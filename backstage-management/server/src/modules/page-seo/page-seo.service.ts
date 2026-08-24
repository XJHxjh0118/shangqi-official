import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPageSeoDto } from './dto/page-seo.dto';

const DEFAULT_PAGES = [
  { pageKey: 'home', titleZh: '首页', titleEn: 'Home' },
  { pageKey: 'about', titleZh: '关于我们', titleEn: 'About' },
  { pageKey: 'products', titleZh: '产品中心', titleEn: 'Products' },
  { pageKey: 'contact', titleZh: '联系我们', titleEn: 'Contact' },
  { pageKey: 'join', titleZh: '加入我们', titleEn: 'Join Us' },
];

@Injectable()
export class PageSeoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    await this.ensureDefaults();
    return this.prisma.pageSeo.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findByKey(pageKey: string) {
    await this.ensureDefaults();
    return this.prisma.pageSeo.findUnique({ where: { pageKey } });
  }

  async upsert(dto: UpsertPageSeoDto) {
    return this.prisma.pageSeo.upsert({
      where: { pageKey: dto.pageKey },
      update: dto,
      create: dto,
    });
  }

  private async ensureDefaults() {
    await Promise.all(
      DEFAULT_PAGES.map((page) =>
        this.prisma.pageSeo.upsert({
          where: { pageKey: page.pageKey },
          update: {},
          create: page,
        }),
      ),
    );
  }
}
