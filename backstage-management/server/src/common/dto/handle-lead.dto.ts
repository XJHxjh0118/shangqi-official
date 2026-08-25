import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const HANDLE_METHODS = ['PHONE', 'EMAIL', 'CHAT', 'OTHER'] as const;
export const HANDLE_RESULTS = [
  'REPLIED',
  'QUOTED',
  'INVALID',
  'CLOSED',
] as const;

export type HandleMethod = (typeof HANDLE_METHODS)[number];
export type HandleResult = (typeof HANDLE_RESULTS)[number];

export class HandleLeadDto {
  @ApiProperty({ enum: HANDLE_METHODS })
  @IsIn(HANDLE_METHODS)
  handleMethod: HandleMethod;

  @ApiProperty({ enum: HANDLE_RESULTS })
  @IsIn(HANDLE_RESULTS)
  handleResult: HandleResult;

  @ApiProperty()
  @IsString()
  @MinLength(2, { message: '请填写处理说明' })
  @MaxLength(2000)
  handleRemark: string;
}

export type LeadHandler = {
  id: number;
  username?: string;
  nickname?: string | null;
};

export function handleLeadData(dto: HandleLeadDto, user: LeadHandler) {
  return {
    status: 'HANDLED',
    handleMethod: dto.handleMethod,
    handleResult: dto.handleResult,
    handleRemark: dto.handleRemark.trim(),
    handledBy: user.nickname?.trim() || user.username || '未知用户',
    handledById: user.id,
    handledAt: new Date(),
  };
}
