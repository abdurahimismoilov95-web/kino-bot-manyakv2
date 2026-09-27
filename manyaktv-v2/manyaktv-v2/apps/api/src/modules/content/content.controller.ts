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

  // ─── STATIC routes — :id dan OLDIN bo'lishi SHART ─────────────

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

  /** BUG FIX: history/mine va favorites/mine :id dan OLDIN turishi kerak */
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
  @ApiOperation({ summary: 'Sevimlilar ro\'yxati' })
  getFavorites(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.contentService.getFavorites(user.id, +page, +limit);
  }

  // ─── LIST ─────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Kino/seriallar ro\'yxati (filter va search bilan)' })
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
      // String → boolean conversion (query params always come as strings)
      isPremium:  isPremium  === 'true' ? true : isPremium  === 'false' ? false : undefined,
      isTrending: isTrending === 'true' ? true : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
    });
  }

  // ─── Parametric route `:id` — STATIC routelardan KEYIN ──────

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.contentService.findById(id);
  }

  // ─── Admin CRUD ───────────────────────────────────────────────

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: '[Admin] Kino qo\'shish' })
  create(@Body() body: any) {
    return this.contentService.create(body);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: '[Admin] Kino tahrirlash' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.contentService.update(id, body);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Kino o\'chirish' })
  delete(@Param('id') id: string) {
    return this.contentService.delete(id);
  }

  @Patch(':id/transcode-status')
  @AdminOnly()
  @ApiOperation({ summary: '[Admin] Transcode holati yangilash' })
  updateTranscodeStatus(
    @Param('id') id: string,
    @Body() body: { status: string; qualities: string[] },
  ) {
    return this.contentService.updateTranscodeStatus(id, body.status, body.qualities);
  }

  // ─── User actions ────────────────────────────────────────────

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ko\'rishlar sonini oshirish' })
  async view(@Param('id') id: string) {
    await this.contentService.incrementViews(id);
    return { ok: true };
  }

  @Post(':id/watch-progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ko\'rish progress saqlash' })
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
  @ApiOperation({ summary: 'Sevimli qo\'shish / olib tashlash' })
  toggleFavorite(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contentService.toggleFavorite(user.id, id);
  }
}
