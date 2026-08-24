import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryOperationLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: '操作用户' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '行为，如新增 / 修改 / 删除' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: '接口' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  startAt?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endAt?: string;
}
