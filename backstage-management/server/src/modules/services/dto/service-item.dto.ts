import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceItemDto {
  @ApiProperty({ example: 'warranty' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  titleZh: string;

  @ApiProperty()
  @IsString()
  titleEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

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

export class UpdateServiceItemDto extends PartialType(CreateServiceItemDto) {}
