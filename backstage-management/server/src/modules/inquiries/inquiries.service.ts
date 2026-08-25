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
