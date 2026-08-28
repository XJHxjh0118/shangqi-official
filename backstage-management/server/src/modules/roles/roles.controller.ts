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
import { CreateRoleDto, QueryRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('account/role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post('menus')
  @Menus('account:role', 'account:staff')
  menuCatalog() {
    return this.rolesService.menuCatalog();
  }

  @Post('list')
  @Menus('account:role', 'account:staff')
  findAll(@Body() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Post('add')
  @Menus('account:role')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch('update/:id')
  @Menus('account:role')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete('delete/:id')
  @Menus('account:role')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
