import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '登录（兼容 pure-admin）' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '经销商注册，待管理员审批' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: '刷新 Token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Get('async-routes')
  @ApiOperation({ summary: '异步路由（业务路由由前端静态注册）' })
  asyncRoutes() {
    return [];
  }

  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: '当前用户信息' })
  profile(@CurrentUser() user: { id: number }) {
    return this.authService.profile(user.id);
  }
}
