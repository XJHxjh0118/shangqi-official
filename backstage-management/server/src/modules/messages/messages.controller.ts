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
import { MessagesService } from './messages.service';

class UpdateMessageStatusDto {
  @ApiProperty()
  @IsString()
  status: string;
}

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('message')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('list')
  findAll(@Query() query: PaginationDto) {
    return this.messagesService.findAll(query);
  }

  @Get('detail/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.findOne(id);
  }

  @Patch('status/:id')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMessageStatusDto,
  ) {
    return this.messagesService.updateStatus(id, dto.status);
  }
}
