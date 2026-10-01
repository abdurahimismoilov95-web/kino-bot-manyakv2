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

/**
 * Ochiq (public) javoblarda pullik videolarning manzili yashiriladi.
 * Video manzili faqat /streaming orqali, ruxsat tekshirilgandan keyin beriladi.
 * Admin panel to'liq ma'lumotni /content/admin/all va /content/:id/full dan oladi.
 */
@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'content', version: '1' })
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  private clampLimit(v: unknown, def: number, max: number): number {
    const n = Math.floor(Number(v) || def);
    return Math.min(Math.max(n, 1), max);
  }

  @Get('featured')
  @Public()
  async getFeatured() {
    const list = await this.contentService.getFeatured();
    list.forEach((c) => this.contentService.publicView(c));
    return list;
  }

  @Get('trending')
  @Public()
  async getTrending() {
    const list = await this.contentService.getTrending();
    list.forEach((c) => this.contentService.publicView(c));
    return list;
  }

  @Get('history/mine')
  @ApiOperation({ summary: 'Kuzatish tarixi' })
  async getHistory(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const r = await this.contentService.getWatchHistory(user.id, +page || 1, this.clampLimit(limit, 20, 100));
    r.data.forEach((h) => this.contentService.publicView(h.content));
    return r;
  }

  @Get('favorites/mine')
  @ApiOperation({ summary: 'Sevimlilar royxati' })
  async getFavorites(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const r = await this.contentService.getFavorites(user.id, +page || 1, this.clampLimit(limit, 20, 100));
    r.data.forEach((f) => this.contentService.publicView(f.content));
    return r;
  }

  @Get('admin/all')
  @AdminOnly()
  @ApiOperation({ summary: 'Admin: to\'liq kontent ro\'yxati (video manzillari bilan)' })
  findAllAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 100,
    @Query('search') search?: string,
  ) {
    return this.contentService.findAll({
      page: +page || 1,
      limit: this.clampLimit(limit, 100, 200),
      search,
    });
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Kino/seriallar royxati' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('type') type?: ContentType,
    @Query('genre') genre?: string,
    @Query('isPremium') isPremium?: string,
    @Query('isTrending') isTrending?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const r = await this.contentService.findAll({
      page: +page || 1,
      limit: this.clampLimit(limit, 20, 100),
      search,
      type,
      genre,
      isPremium: isPremium === 'true' ? true : isPremium === 'false' ? false : undefined,
      isTrending: isTrending === 'true' ? true : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
    });
    r.data.forEach((c) => this.contentService.publicView(c));
    return r;
  }

  @Get(':id/full')
  @AdminOnly()
  @ApiOperation({ summary: 'Admin: kontent to\'liq (video manzillari bilan)' })
  findOneFull(@Param('id') id: string) {
    return this.contentService.findById(id);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const c = await this.contentService.findById(id);
    this.contentService.publicView(c);
    return c;
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
