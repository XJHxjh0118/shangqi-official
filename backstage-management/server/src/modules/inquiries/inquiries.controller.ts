import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

  @Post('list')
  @Menus('lead:inquiry')
  findAll(@Body() query: StatusPaginationDto) {
    return this.inquiriesService.findAll(query);
  }

  @Post('detail/:id')
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
