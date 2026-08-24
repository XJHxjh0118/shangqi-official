import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.contactPerson.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  create(dto: CreateContactDto) {
    return this.prisma.contactPerson.create({ data: dto });
  }

  async update(id: number, dto: UpdateContactDto) {
    await this.ensureExists(id);
    return this.prisma.contactPerson.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.contactPerson.delete({ where: { id } });
    return true;
  }

  private async ensureExists(id: number) {
    const row = await this.prisma.contactPerson.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('对接人不存在');
    return row;
  }
}
