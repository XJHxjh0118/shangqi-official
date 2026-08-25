import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Menus } from '../../common/decorators/menus.decorator';
import { HandleLeadDto, type LeadHandler } from '../../common/dto/handle-lead.dto';
import { StatusPaginationDto } from '../../common/dto/pagination.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('message')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('list')
  @Menus('lead:message')
  findAll(@Query() query: StatusPaginationDto) {
    return this.messagesService.findAll(query);
  }

  @Get('detail/:id')
  @Menus('lead:message')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.findOne(id);
  }

  @Patch('handle/:id')
  @Menus('lead:message')
  handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HandleLeadDto,
    @CurrentUser() user: LeadHandler,
  ) {
    return this.messagesService.handle(id, dto, user);
  }
}
