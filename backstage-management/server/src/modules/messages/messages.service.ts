import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { handleLeadData, HandleLeadDto, LeadHandler } from '../../common/dto/handle-lead.dto';
import { pageResult, paginate, StatusPaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
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
              { name: { contains: query.keyword } },
              { email: { contains: query.keyword } },
              { company: { contains: query.keyword } },
              { region: { contains: query.keyword } },
              { content: { contains: query.keyword } },
            ],
          }
        : {}),
    };
    const [list, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return pageResult(list, total, page, pageSize);
  }

  async findOne(id: number) {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('留言不存在');
    return row;
  }

  async handle(id: number, dto: HandleLeadDto, user: LeadHandler) {
    const row = await this.findOne(id);
    if (row.status === 'HANDLED') {
      throw new BadRequestException('该留言已处理');
    }
    return this.prisma.contactMessage.update({
      where: { id },
      data: handleLeadData(dto, user),
    });
  }
}
