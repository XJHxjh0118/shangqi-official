import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Menus } from '../../common/decorators/menus.decorator';
import {
  BatchProductDto,
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('product')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('list')
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get('detail/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post('add')
  @Menus('product:list')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch('batch')
  @Menus('product:list', 'cms:featured', 'cms:new-hot')
  batch(@Body() dto: BatchProductDto) {
    return this.productsService.batchUpdate(dto);
  }

  @Patch('update/:id')
  @Menus('product:list', 'cms:featured', 'cms:new-hot')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete('delete/:id')
  @Menus('product:list')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
