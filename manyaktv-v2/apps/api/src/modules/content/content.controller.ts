import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ContentType } from './entities/content.entity';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'content', version: '1' })
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('featured')
  @Public()
  getFeatured() {
    return this.contentService.getFeatured();
  }

  @Get('trending')
  @Public()
  getTrending() {
    return this.contentService.getTrending();
  }

  @Get('history/mine')
  @ApiOperation({ summary: 'Kuzatish tarixi' })
  getHistory(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.contentService.getWatchHistory(user.id, +page, +limit);
  }

  @Get('favorites/mine')
  @ApiOperation({ summary: 'Sevimlilar royxati' })
  getFavorites(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.contentService.getFavorites(user.id, +page, +limit);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Kino/seriallar royxati' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('type') type?: ContentType,
    @Query('genre') genre?: string,
    @Query('isPremium') isPremium?: string,
    @Query('isTrending') isTrending?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    return this.contentService.findAll({
      page: +page,
      limit: +limit,
      search,
      type,
      genre,
      isPremium: isPremium === 'true' ? true : isPremium === 'false' ? false : undefined,
      isTrending: isTrending === 'true' ? true : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
    });
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.contentService.findById(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() body: any) {
    return this.contentService.create(body);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: any) {
    return this.contentService.update(id, body);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.contentService.delete(id);
  }

  @Patch(':id/transcode-status')
  @AdminOnly()
  updateTranscodeStatus(
    @Param('id') id: string,
    @Body() body: { status: string; qualities: string[] },
  ) {
    return this.contentService.updateTranscodeStatus(id, body.status, body.qualities);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async view(@Param('id') id: string) {
    await this.contentService.incrementViews(id);
    return { ok: true };
  }

  @Post(':id/watch-progress')
  @HttpCode(HttpStatus.OK)
  async saveProgress(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { episodeId?: string; progressSeconds: number; durationSeconds: number },
  ) {
    return this.contentService.upsertWatchHistory(
      user.id,
      id,
      body.episodeId ?? null,
      body.progressSeconds,
      body.durationSeconds,
    );
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  toggleFavorite(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contentService.toggleFavorite(user.id, id);
  }
}
