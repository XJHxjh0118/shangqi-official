import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InquiriesService } from './inquiries.service';

class UpdateInquiryStatusDto {
  @ApiProperty()
  @IsString()
  status: string;
}

@ApiTags('Inquiries')
@ApiBearerAuth()
@Controller('inquiry')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get('list')
  findAll(@Query() query: PaginationDto) {
    return this.inquiriesService.findAll(query);
  }

  @Get('detail/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inquiriesService.findOne(id);
  }

  @Patch('status/:id')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    return this.inquiriesService.updateStatus(id, dto.status);
  }
}
