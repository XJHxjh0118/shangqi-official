import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { Menus } from '../../common/decorators/menus.decorator';
import { ConfirmProductImportDto } from './dto/confirm-import.dto';
import {
  ExportImportService,
  PRODUCT_XLSX_CONTENT_TYPE,
} from './export-import.service';

function excelStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function sendExcel(res: Response, buffer: Buffer, filename: string, asciiFallback: string) {
  res.setHeader('Content-Type', PRODUCT_XLSX_CONTENT_TYPE);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  res.send(buffer);
}

function parseExportIds(raw?: string) {
  return String(raw || '')
    .split(/[,?\s]+/)
    .map((item) => Number(item))
    .filter((id) => Number.isInteger(id) && id > 0);
}

@ApiTags('ExportImport')
@ApiBearerAuth()
@Controller('product')
export class ExportImportController {
  constructor(private readonly service: ExportImportService) {}

  @Post('import-template')
  @Menus('product:list')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.service.buildTemplate();
    const stamp = excelStamp();
    sendExcel(
      res,
      buffer,
      `??????_${stamp}.xlsx`,
      `product-import-template-${stamp}.xlsx`,
    );
  }

  @Post('export')
  @Menus('product:list')
  async exportProducts(@Res() res: Response, @Body('ids') ids?: string) {
    const buffer = await this.service.exportProducts(parseExportIds(ids));
    const stamp = excelStamp();
    sendExcel(res, buffer, `????_${stamp}.xlsx`, `products-${stamp}.xlsx`);
  }

  @Post('import')
  @Menus('product:list')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  importProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('??? Excel ???.xlsx / .xls?');
    }
    return this.service.previewImport(file.buffer);
  }

  @Post('import/confirm')
  @Menus('product:list')
  confirmImport(@Body() dto: ConfirmProductImportDto) {
    return this.service.confirmImport(dto.previewId, dto.skus);
  }

  @Delete('import/:id')
  @Menus('product:list')
  removeImported(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeImported(id);
  }
}
