import { Injectable, NotFoundException } from '@nestjs/common';
import { pageResult, paginate } from '../../common/dto/pagination.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { skip, take } = paginate(page, pageSize);
    const where = query.keyword
      ? {
          OR: [
            { company: { contains: query.keyword } },
            { contactName: { contains: query.keyword } },
            { email: { contains: query.keyword } },
          ],
        }
      : {};
    const [list, total] = await this.prisma.$transaction([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: {
          items: { include: { product: { include: { i18n: true } } } },
        },
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return pageResult(list, total, page, pageSize);
  }

  async findOne(id: number) {
    const row = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { i18n: true } } } },
      },
    });
    if (!row) throw new NotFoundException('咨询单不存在');
    return row;
  }

  async updateStatus(id: number, status: string) {
    await this.findOne(id);
    return this.prisma.inquiry.update({ where: { id }, data: { status } });
  }
}
