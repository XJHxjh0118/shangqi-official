import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteNameZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteNameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoKeywordsZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoKeywordsEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescriptionZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerTextZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerTextEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboutTitleZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboutTitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboutBodyZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboutBodyEn?: string;
}
