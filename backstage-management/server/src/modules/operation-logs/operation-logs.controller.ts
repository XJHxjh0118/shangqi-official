import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Menus } from '../../common/decorators/menus.decorator';
import { QueryOperationLogDto } from './dto/operation-log.dto';
import { OperationLogsService } from './operation-logs.service';

@ApiTags('Operation Logs')
@ApiBearerAuth()
@Menus('logs:index')
@Controller('logs')
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get('list')
  findAll(@Query() query: QueryOperationLogDto) {
    return this.operationLogsService.findAll(query);
  }
}
