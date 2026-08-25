import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmProductImportDto {
  @ApiProperty({ description: '导入预览 ID，由解析 Excel 接口返回' })
  @IsString()
  @IsNotEmpty()
  previewId: string;

  @ApiProperty({ type: [String], description: '确认写入的产品 SKU 列表' })
  @IsArray()
  @ArrayMinSize(1, { message: '没有可导入的产品' })
  @IsString({ each: true })
  skus: string[];
}
