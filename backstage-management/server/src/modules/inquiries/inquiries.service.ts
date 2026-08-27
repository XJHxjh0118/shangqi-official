import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { handleLeadData, HandleLeadDto, LeadHandler } from '../../common/dto/handle-lead.dto';
import { pageResult, paginate, StatusPaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: StatusPaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { skip, take } = paginate(page, pageSize);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.keyword
        ? {
            OR: [
              { company: { contains: query.keyword } },
              { contactName: { contains: query.keyword } },
              { email: { contains: query.keyword } },
              { phone: { contains: query.keyword } },
              { region: { contains: query.keyword } },
              { message: { contains: query.keyword } },
            ],
          }
        : {}),
    };
    const [list, total] = await this.prisma.$transaction([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, company: true, nickname: true },
          },
          items: { include: { product: { include: { i18n: true } } } },
        },
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return pageResult(list, total, page, pageSize);
  }

  async findMine(userId: number, query: StatusPaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { skip, take } = paginate(page, pageSize);
    const keyword = query.keyword?.trim();
    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(keyword
        ? {
            OR: [
              { company: { contains: keyword } },
              { contactName: { contains: keyword } },
              { email: { contains: keyword } },
              { phone: { contains: keyword } },
              { message: { contains: keyword } },
              { handleRemark: { contains: keyword } },
              {
                items: {
                  some: {
                    product: {
                      OR: [
                        { sku: { contains: keyword } },
                        { slug: { contains: keyword } },
                        {
                          i18n: {
                            some: { name: { contains: keyword } },
                          },
                        },
                      ],
                    },
                  },
                },
              },
              // 允许搜单号数字
              ...(Number.isFinite(Number(keyword))
                ? [{ id: Number(keyword) }]
                : []),
            ],
          }
        : {}),
    };
    const [list, total] = await this.prisma.$transaction([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  slug: true,
                  coverUrl: true,
                  i18n: { select: { locale: true, name: true } },
                },
              },
            },
          },
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
        user: {
          select: { id: true, username: true, company: true, nickname: true },
        },
        items: { include: { product: { include: { i18n: true } } } },
      },
    });
    if (!row) throw new NotFoundException('咨询单不存在');
    return row;
  }

  async handle(id: number, dto: HandleLeadDto, user: LeadHandler) {
    const row = await this.findOne(id);
    if (row.status === 'HANDLED') {
      throw new BadRequestException('该询盘已处理');
    }
    return this.prisma.inquiry.update({
      where: { id },
      data: handleLeadData(dto, user),
    });
  }
}
