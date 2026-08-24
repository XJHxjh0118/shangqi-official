import { BadRequestException } from '@nestjs/common';

export function parseOptionalDate(value?: string | Date | null) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('时间格式不正确');
  }
  return date;
}
