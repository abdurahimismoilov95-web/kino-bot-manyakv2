import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller({ path: 'verify', version: '1' })
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  /** POST /api/v1/verify/start -> { code, deepLink, expiresIn } */
  @Post('start')
  @Public()
  @HttpCode(HttpStatus.OK)
  start(@Body() _body: Record<string, unknown>) {
    return this.verifyService.start();
  }

  /** GET /api/v1/verify/status?code=XXXX -> { verified, token?, user? } */
  @Get('status')
  @Public()
  status(@Query('code') code: string) {
    if (!code) return { verified: false, expired: true };
    return this.verifyService.status(code);
  }
}
