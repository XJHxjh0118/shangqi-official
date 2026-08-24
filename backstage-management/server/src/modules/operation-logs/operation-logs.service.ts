import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  pageResult,
  paginate,
} from '../../common/dto/pagination.dto';
import { parseOptionalDate } from '../../common/date.util';
import {
  displayAction,
  displayApi,
  displayDescription,
} from '../../common/operation-log.meta';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryOperationLogDto } from './dto/operation-log.dto';

const LEGACY_ACTION_METHODS: Record<string, string[]> = {
  新增: ['POST'],
  修改: ['PATCH', 'PUT'],
  删除: ['DELETE'],
};

@Injectable()
export class OperationLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryOperationLogDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { skip, take } = paginate(page, pageSize);
    const startAt = query.startAt ? parseOptionalDate(query.startAt) : null;
    const endAt = query.endAt ? parseOptionalDate(query.endAt) : null;

    const legacyMethods = query.action
      ? LEGACY_ACTION_METHODS[query.action] || []
      : [];
    const where: Prisma.OperationLogWhereInput = {
      ...(query.username ? { username: { contains: query.username } } : {}),
      ...(query.action
        ? {
            OR: [
              { action: { contains: query.action } },
              ...(legacyMethods.length
                ? [
                    {
                      AND: [
                        { action: { in: ['POST', 'PUT', 'PATCH', 'DELETE'] } },
                        { method: { in: legacyMethods } },
                      ],
                    },
                  ]
                : []),
            ],
          }
        : {}),
      ...(query.path ? { path: { contains: query.path } } : {}),
      ...(startAt || endAt
        ? {
            createdAt: {
              ...(startAt ? { gte: startAt } : {}),
              ...(endAt ? { lte: endAt } : {}),
            },
          }
        : {}),
      ...(query.keyword
        ? {
            OR: [
              { username: { contains: query.keyword } },
              { action: { contains: query.keyword } },
              { path: { contains: query.keyword } },
              { detail: { contains: query.keyword } },
            ],
          }
        : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ]);
    return pageResult(
      list.map((row) => ({
        id: row.id,
        username: row.username || '',
        action: displayAction(row),
        path: displayApi(row),
        createdAt: row.createdAt,
        description: displayDescription(row),
      })),
      total,
      page,
      pageSize,
    );
  }
}
