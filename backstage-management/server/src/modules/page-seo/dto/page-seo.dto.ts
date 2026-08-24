import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpsertPageSeoDto {
  @ApiProperty({ example: 'home' })
  @IsString()
  pageKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keywordsZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keywordsEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionZh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;
}
