import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

function toOptionalBoolean({ value }: { value: unknown }) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return undefined;
}

export class ProductI18nDto {
  @ApiProperty({ example: 'zh' })
  @IsString()
  locale: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'SEO 标题，空则回退产品名' })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO 关键词，逗号分隔' })
  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @ApiPropertyOptional({ description: 'SEO 描述，空则回退产品描述' })
  @IsOptional()
  @IsString()
  seoDescription?: string;
}

export class QueryProductDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: [Number], description: '适配车型 ID 列表' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  vehicleIds?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  installLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetPackUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ description: '封面图文件名' })
  @IsOptional()
  @IsString()
  coverName?: string;

  @ApiPropertyOptional({ description: '产品宣传视频 URL' })
  @IsOptional()
  @IsString()
  promoVideoUrl?: string;

  @ApiPropertyOptional({ description: '宣传视频文件名' })
  @IsOptional()
  @IsString()
  promoVideoName?: string;

  @ApiPropertyOptional({ description: '安装示范视频 URL' })
  @IsOptional()
  @IsString()
  installVideoUrl?: string;

  @ApiPropertyOptional({ description: '安装视频文件名' })
  @IsOptional()
  @IsString()
  installVideoName?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @ApiProperty({ type: [ProductI18nDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductI18nDto)
  i18n: ProductI18nDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: [Number], description: '适配车型 ID 列表' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  vehicleIds?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  installLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetPackUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ description: '封面图文件名' })
  @IsOptional()
  @IsString()
  coverName?: string;

  @ApiPropertyOptional({ description: '产品宣传视频 URL' })
  @IsOptional()
  @IsString()
  promoVideoUrl?: string;

  @ApiPropertyOptional({ description: '宣传视频文件名' })
  @IsOptional()
  @IsString()
  promoVideoName?: string;

  @ApiPropertyOptional({ description: '安装示范视频 URL' })
  @IsOptional()
  @IsString()
  installVideoUrl?: string;

  @ApiPropertyOptional({ description: '安装视频文件名' })
  @IsOptional()
  @IsString()
  installVideoName?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ type: [ProductI18nDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductI18nDto)
  i18n?: ProductI18nDto[];
}

export class BatchProductDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
