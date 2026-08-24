import { Injectable, NotFoundException } from '@nestjs/common';
import { pageResult, paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { skip, take } = paginate(page, pageSize);
    const where = query.keyword
      ? {
          OR: [
            { name: { contains: query.keyword } },
            { email: { contains: query.keyword } },
            { company: { contains: query.keyword } },
          ],
        }
      : {};
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

  async updateStatus(id: number, status: string) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({ where: { id }, data: { status } });
  }
}
