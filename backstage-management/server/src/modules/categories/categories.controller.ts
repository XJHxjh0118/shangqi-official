import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Menus } from '../../common/decorators/menus.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, QueryCategoryDto, ReorderCategoryChildrenDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('product/category')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('list')
  findAll(@Body() query: QueryCategoryDto) {
    return this.categoriesService.findAll(query);
  }

  @Post('flat')
  findFlat() {
    return this.categoriesService.findFlat();
  }

  @Post('add')
  @Menus('product:category')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('children-sort/:id')
  @Menus('product:category')
  reorderChildren(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderCategoryChildrenDto,
  ) {
    return this.categoriesService.reorderChildren(id, dto.ids);
  }

  @Patch('update/:id')
  @Menus('product:category')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('delete/:id')
  @Menus('product:category')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
