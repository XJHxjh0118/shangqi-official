import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ListFilterDto } from '../../../common/dto/list-filter.dto';

export class BannerI18nDto {
  @ApiProperty({ example: 'zh' })
  @IsString()
  locale: string;

  @ApiProperty()
  @IsString()
  title: string;
}

export class CreateBannerDto {
  @ApiPropertyOptional({ description: '兼容字段；优先使用 i18n' })
  @IsOptional()
  @IsString()
  titleZh?: string;

  @ApiPropertyOptional({ description: '兼容字段；优先使用 i18n' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ type: [BannerI18nDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerI18nDto)
  i18n?: BannerI18nDto[];

  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

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

  @ApiPropertyOptional({ description: '上线时间' })
  @IsOptional()
  @IsString()
  startAt?: string;

  @ApiPropertyOptional({ description: '下线时间' })
  @IsOptional()
  @IsString()
  endAt?: string;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

export class ReorderBannersDto {
  @ApiProperty({ type: [Number], description: '按新顺序排列的 Banner ID' })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}

export class QueryBannerDto extends ListFilterDto {}
