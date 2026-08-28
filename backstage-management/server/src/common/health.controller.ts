import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  @Post()
  @ApiOperation({ summary: '健康检查（部署探活）' })
  check() {
    return {
      ok: true,
      service: 'official-site-api',
      timestamp: new Date().toISOString(),
    };
  }
}
