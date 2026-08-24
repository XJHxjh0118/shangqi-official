import {
  Controller,
  Get,
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
import { ExportImportService } from './export-import.service';

@ApiTags('ExportImport')
@ApiBearerAuth()
@Menus('product:import-export')
@Controller('product')
export class ExportImportController {
  constructor(private readonly service: ExportImportService) {}

  @Get('export')
  async exportProducts(@Res() res: Response) {
    const buffer = await this.service.exportProducts();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=products.xlsx',
    );
    res.send(buffer);
  }

  @Post('import')
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
    return this.service.importProducts(file.buffer);
  }
}
