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
import { InquiriesService } from './inquiries.service';

@ApiTags('Inquiries')
@ApiBearerAuth()
@Controller('inquiry')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get('list')
  @Menus('lead:inquiry')
  findAll(@Query() query: StatusPaginationDto) {
    return this.inquiriesService.findAll(query);
  }

  @Get('detail/:id')
  @Menus('lead:inquiry')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inquiriesService.findOne(id);
  }

  @Patch('handle/:id')
  @Menus('lead:inquiry')
  handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HandleLeadDto,
    @CurrentUser() user: LeadHandler,
  ) {
    return this.inquiriesService.handle(id, dto, user);
  }
}
