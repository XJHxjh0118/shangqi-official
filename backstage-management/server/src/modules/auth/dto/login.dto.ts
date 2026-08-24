import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'dealer@example.com', description: '登录邮箱' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'dealer123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '华东经销商有限公司' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ example: '张三' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ example: 'CN', description: '所属国家/地区' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty({ example: '李明远', description: '区域经理姓名' })
  @IsString()
  @IsNotEmpty()
  regionalManager: string;

  @ApiPropertyOptional({ example: '浦东新区xx路xx号' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+86 21 0000 1001' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class ForgotSendCodeDto {
  @ApiProperty({ example: 'dealer@example.com', description: '注册邮箱或手机号' })
  @IsString()
  @IsNotEmpty()
  account: string;
}

export class ForgotResetDto {
  @ApiProperty({ example: 'dealer@example.com' })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'newpass123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
