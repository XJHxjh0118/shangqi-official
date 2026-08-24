import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: '中国 / 上海' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: '浦东新区xx路xx号' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}
