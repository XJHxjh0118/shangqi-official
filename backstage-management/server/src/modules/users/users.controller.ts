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
import { CreateUserDto, QueryUserDto, UpdateUserDto, ResetPasswordDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Menus('account:staff', 'account:list', 'account:role')
@Controller('account/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('list')
  findAll(@Body() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Post('detail/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post('add')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch('approve/:id')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.approve(id);
  }

  @Patch('reject/:id')
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.reject(id);
  }

  @Patch('reset-password/:id')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, dto.password);
  }

  @Patch('update/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete('delete/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
