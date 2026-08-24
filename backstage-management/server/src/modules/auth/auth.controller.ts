import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotResetDto,
  ForgotSendCodeDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  UpdateProfileDto,
} from './dto/login.dto';

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
  @Post('forgot/send-code')
  @ApiOperation({ summary: '忘记密码：发送验证码' })
  sendResetCode(@Body() dto: ForgotSendCodeDto) {
    return this.authService.sendResetCode(dto.account);
  }

  @Public()
  @Post('forgot/reset')
  @ApiOperation({ summary: '忘记密码：校验验证码并设置新密码' })
  resetPassword(@Body() dto: ForgotResetDto) {
    return this.authService.resetPassword(dto.account, dto.code, dto.password);
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

  @ApiBearerAuth()
  @Patch('profile')
  @ApiOperation({ summary: '更新联系信息、手机号、邮箱' })
  updateProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: '修改登录密码' })
  changePassword(
    @CurrentUser() user: { id: number },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}
