import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { fail } from '../http/api-response';

const STATUS_MSG: Record<number, string> = {
  400: '请求参数有误',
  401: '未登录或登录已过期',
  403: '没有权限访问该资源',
  404: '资源不存在',
  409: '数据冲突',
  413: '上传文件过大',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误',
};

const GENERIC_MSG = new Set([
  'unauthorized',
  'forbidden',
  'not found',
  'bad request',
  'internal server error',
  'httpexception',
]);

function pickMessage(raw: unknown, fallback: string): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw)) {
    const joined = raw
      .map((item) => (typeof item === 'string' ? item : ''))
      .filter(Boolean)
      .join('；');
    if (joined) return joined;
  }
  return fallback;
}

function isGeneric(message: string) {
  return GENERIC_MSG.has(message.trim().toLowerCase());
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let msg = STATUS_MSG[status];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      const fallback = STATUS_MSG[status] || exception.message || '请求失败';
      if (typeof res === 'string') {
        msg = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as { message?: string | string[]; msg?: string };
        msg = pickMessage(body.msg, pickMessage(body.message, fallback));
      } else {
        msg = exception.message || fallback;
      }
      if (isGeneric(msg)) msg = fallback;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.BAD_REQUEST;
        msg = '数据已存在，请检查是否重复提交';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        msg = '记录不存在';
      } else {
        msg = '数据库操作失败';
      }
    } else if (exception instanceof Error && exception.message) {
      msg = exception.message;
    }

    response.status(status).json(fail(status, msg));
  }
}
