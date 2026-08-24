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

export class CategoryI18nDto {
  @ApiProperty({ example: 'zh' })
  @IsString()
  locale: string;

  @ApiProperty()
  @IsString()
  name: string;
}

export class NestedChildCategoryDto {
  @ApiPropertyOptional({ description: '已有子分类 ID，新建时不传' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ type: [CategoryI18nDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryI18nDto)
  i18n?: CategoryI18nDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;
}

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '兼容字段；优先使用 i18n' })
  @IsOptional()
  @IsString()
  nameZh?: string;

  @ApiPropertyOptional({ description: '兼容字段；优先使用 i18n' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ type: [CategoryI18nDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryI18nDto)
  i18n?: CategoryI18nDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

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

  @ApiPropertyOptional({
    type: [NestedChildCategoryDto],
    description: '主分类下的子分类，保存时统一创建/更新/排序',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedChildCategoryDto)
  children?: NestedChildCategoryDto[];
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class ReorderCategoryChildrenDto {
  @ApiProperty({ type: [Number], description: '按新顺序排列的子分类 ID' })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}
