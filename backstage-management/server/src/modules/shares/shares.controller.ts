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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SYSTEM_ROLE } from '../../common/system-role';
import { CreateShareLinkDto, UpdateShareLinkDto } from './dto/share.dto';
import { SharesService } from './shares.service';

@ApiTags('Shares')
@ApiBearerAuth()
@Roles(SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.EDITOR, SYSTEM_ROLE.DEALER)
@Controller('share')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post('list')
  findAll(@CurrentUser() user: { id: number; role: string }) {
    return this.sharesService.findAll(user);
  }

  @Post('add')
  create(
    @CurrentUser() user: { id: number; role: string },
    @Body() dto: CreateShareLinkDto,
  ) {
    return this.sharesService.create(user, dto);
  }

  @Patch('update/:id')
  update(
    @CurrentUser() user: { id: number; role: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShareLinkDto,
  ) {
    return this.sharesService.update(user, id, dto);
  }

  @Delete('delete/:id')
  remove(
    @CurrentUser() user: { id: number; role: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sharesService.remove(user, id);
  }
}
