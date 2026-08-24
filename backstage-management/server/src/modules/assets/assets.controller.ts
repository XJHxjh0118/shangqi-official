import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { memoryStorage } from 'multer';
import { AssetsService } from './assets.service';

const uploadLimits = { fileSize: 50 * 1024 * 1024 };

class BindAssetItemDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (value == null || value === '' ? undefined : Number(value)))
  @IsInt()
  size?: number;

  @IsOptional()
  @IsInt()
  sort?: number;
}

class BindAssetsDto {
  @IsInt()
  productId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BindAssetItemDto)
  items!: BindAssetItemDto[];
}

class UploadAssetDto {
  @IsOptional()
  @IsString()
  name?: string;
}

class UploadBatchDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    return Array.isArray(value) ? value.map(String) : [String(value)];
  })
  @IsString({ each: true })
  names?: string[];
}

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('product/asset')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string', description: '原始文件名（UTF-8）' },
        productId: { type: 'integer' },
        sort: { type: 'integer' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: uploadLimits,
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadAssetDto,
    @Query('productId') productId?: string,
    @Query('sort') sort?: string,
  ) {
    return this.assetsService.upload(
      file,
      productId ? Number(productId) : undefined,
      sort ? Number(sort) : 0,
      body?.name,
    );
  }

  /** 批量拖拽上传；productId 可选（新建时可不传，仅落盘） */
  @Post('upload-batch')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        names: {
          type: 'array',
          items: { type: 'string' },
          description: '与 files 一一对应的原始文件名',
        },
        productId: { type: 'integer' },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 40, {
      storage: memoryStorage(),
      limits: uploadLimits,
    }),
  )
  uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadBatchDto,
    @Query('productId') productId?: string,
  ) {
    return this.assetsService.uploadMany(
      files,
      productId ? Number(productId) : undefined,
      body?.names,
    );
  }

  /** 把已上传素材绑定到产品 */
  @Post('bind')
  bind(@Body() body: BindAssetsDto) {
    return this.assetsService.bindMany(body.productId, body.items);
  }

  @Get('list/:productId')
  @ApiOperation({ summary: '按产品查询素材，同时返回产品基本信息与语言内容' })
  list(@Param('productId', ParseIntPipe) productId: number) {
    return this.assetsService.listByProduct(productId);
  }

  @Delete('delete/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.remove(id);
  }
}
