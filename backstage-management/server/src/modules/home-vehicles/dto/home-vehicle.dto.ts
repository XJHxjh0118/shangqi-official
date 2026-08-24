import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateHomeVehicleDto {
  @ApiProperty({ description: '关联车型 ID' })
  @Type(() => Number)
  @IsInt()
  vehicleId: number;

  @ApiProperty({ description: '首页展示图' })
  @IsString()
  imageUrl: string;

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

export class UpdateHomeVehicleDto extends PartialType(CreateHomeVehicleDto) {}
