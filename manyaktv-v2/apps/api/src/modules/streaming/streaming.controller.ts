import {
  Controller, Get, Param, UseGuards, Query, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StreamingService } from './streaming.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Streaming')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'streaming', version: '1' })
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Film uchun HLS stream URL olish' })
  async getContentStream(
    @Param('contentId') contentId: string,
    @CurrentUser() user: User,
  ) {
    return this.streamingService.getContentStreamUrl(contentId, user.id);
  }

  @Get('content/:contentId/episode/:episodeId')
  @ApiOperation({ summary: 'Epizod uchun HLS stream URL olish' })
  async getEpisodeStream(
    @Param('contentId') contentId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser() user: User,
  ) {
    return this.streamingService.getEpisodeStreamUrl(contentId, episodeId, user.id);
  }

  @Get('auth')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nginx HLS auth_request validation' })
  async verifyStreamAccess(
    @Query('uid') uid: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ) {
    const isValid = await this.streamingService.verifyStreamToken(uid, exp, sig);
    if (isValid) {
      res.status(200).end();
    } else {
      res.status(403).json({ message: 'Invalid or expired stream token' });
    }
  }
}
