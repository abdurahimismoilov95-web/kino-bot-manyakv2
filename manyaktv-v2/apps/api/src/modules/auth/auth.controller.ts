import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { VerifyDto } from './dto/verify.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 10000 } })
  @ApiOperation({ summary: 'Telegram initData orqali autentifikatsiya' })
  async verify(@Body() dto: VerifyDto) {
    const { token, user } = await this.authService.verifyTelegram(dto);
    return {
      token,
      user: {
        id: user.id, telegramId: user.telegramId,
        firstName: user.firstName, lastName: user.lastName,
        username: user.username, avatarUrl: user.avatarUrl,
        role: user.role, isVip: user.isVipActive,
        vipExpiresAt: user.vipExpiresAt, tokens: user.tokens,
        checkinStreak: user.checkinStreak, isPhoneVerified: user.isPhoneVerified,
      },
    };
  }

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Admin brauzer login (telegramId + secret)' })
  async adminBrowserLogin(@Body() dto: AdminLoginDto) {
    const { token, user } = await this.authService.adminBrowserLogin(dto);
    return {
      token,
      user: {
        id: user.id, telegramId: user.telegramId,
        firstName: user.firstName, lastName: user.lastName,
        username: user.username, avatarUrl: user.avatarUrl,
        role: user.role, isVip: user.isVipActive,
        vipExpiresAt: user.vipExpiresAt, tokens: user.tokens,
        checkinStreak: user.checkinStreak, isPhoneVerified: user.isPhoneVerified,
      },
    };
  }
}
