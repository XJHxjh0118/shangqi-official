import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export function paginate(page = 1, pageSize = 10) {
  const take = pageSize;
  const skip = (page - 1) * pageSize;
  return { skip, take };
}

export function pageResult<T>(list: T[], total: number, page = 1, pageSize = 10) {
  return {
    list,
    total,
    page,
    pageSize,
  };
}
