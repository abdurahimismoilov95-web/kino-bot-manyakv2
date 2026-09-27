import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { HlsAuthCacheService } from './hls-auth.cache';
import { User } from '../users/entities/user.entity';
import { Content } from '../content/entities/content.entity';

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private readonly signingSecret = process.env.FILE_SIGNING_SECRET || 'dev_secret';
  private readonly hlsBase = process.env.NGINX_HLS_BASE_URL || 'http://localhost/hls';
  private readonly tokenTtlSeconds = 600;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Content) private contentRepo: Repository<Content>,
    private readonly hlsCache: HlsAuthCacheService,
  ) {}

  async getContentStreamUrl(contentId: string, userId: string) {
    const content = await this.contentRepo.findOneOrFail({ where: { id: contentId } });
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (content.isPremium && !user.isVip) {
      throw new UnauthorizedException('VIP obuna kerak');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('Akkaunt bloklangan');
    }

    const { token, exp } = this.generateToken(userId);
    const baseUrl = `${this.hlsBase}/${contentId}`;

    return {
      masterPlaylist: `${baseUrl}/master.m3u8?uid=${userId}&exp=${exp}&sig=${token}`,
      availableQualities: ['480p', '720p', '1080p'],
      defaultQuality: '720p',
      tokenExpiry: exp,
    };
  }

  async getEpisodeStreamUrl(contentId: string, episodeId: string, userId: string) {
    const content = await this.contentRepo.findOneOrFail({ where: { id: contentId } });
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (content.isPremium && !user.isVip) {
      throw new UnauthorizedException('VIP obuna kerak');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('Akkaunt bloklangan');
    }

    const { token, exp } = this.generateToken(userId);
    const baseUrl = `${this.hlsBase}/${contentId}/episodes/${episodeId}`;

    return {
      masterPlaylist: `${baseUrl}/master.m3u8?uid=${userId}&exp=${exp}&sig=${token}`,
      availableQualities: ['480p', '720p', '1080p'],
      defaultQuality: '720p',
      tokenExpiry: exp,
    };
  }

  async verifyStreamToken(uid: string, exp: string, sig: string): Promise<boolean> {
    if (!uid || !exp || !sig) return false;

    const cached = await this.hlsCache.getCached(uid, sig);
    if (cached === 'allow') return true;
    if (cached === 'deny') return false;

    const result = await this.verifyFromDb(uid, exp, sig);
    await this.hlsCache.setCached(uid, sig, result ? 'allow' : 'deny');
    return result;
  }

  private async verifyFromDb(uid: string, exp: string, sig: string): Promise<boolean> {
    const expNum = parseInt(exp, 10);
    if (isNaN(expNum) || Date.now() / 1000 > expNum) {
      this.logger.debug(`Token expired for uid=${uid}`);
      return false;
    }

    const expectedSig = this.computeHmac(uid, exp);
    if (!this.timingSafeEqual(sig, expectedSig)) {
      this.logger.warn(`Invalid sig for uid=${uid}`);
      return false;
    }

    const user = await this.userRepo.findOne({
      where: { id: uid },
      select: ['id', 'isBanned'],
    });
    if (!user || user.isBanned) return false;

    return true;
  }

  private generateToken(userId: string): { token: string; exp: number } {
    const exp = Math.floor(Date.now() / 1000) + this.tokenTtlSeconds;
    const token = this.computeHmac(userId, String(exp));
    return { token, exp };
  }

  private computeHmac(uid: string, exp: string): string {
    return createHmac('sha256', this.signingSecret).update(`${uid}:${exp}`).digest('hex');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
}
