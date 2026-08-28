import { Body, Controller, Post } from '@nestjs/common';
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

  @Post('list')
  findAll(@Body() query: QueryOperationLogDto) {
    return this.operationLogsService.findAll(query);
  }
}
