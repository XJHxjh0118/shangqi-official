import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ListFilterDto } from '../../../common/dto/list-filter.dto';

export class CreateVehicleDto {
  @ApiProperty({ example: 'mg4-2024' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  brandZh: string;

  @ApiProperty()
  @IsString()
  brandEn: string;

  @ApiProperty()
  @IsString()
  modelZh: string;

  @ApiProperty()
  @IsString()
  modelEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearFrom?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearTo?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

export class QueryVehicleDto extends ListFilterDto {}
