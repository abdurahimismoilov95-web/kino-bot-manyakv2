import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { HlsAuthCacheService } from './hls-auth.cache';
import { User } from '../users/entities/user.entity';
import { Content } from '../content/entities/content.entity';
import { Episode } from '../content/entities/episode.entity';
import { Receipt, ReceiptStatus, ReceiptType } from '../payment/entities/receipt.entity';

/**
 * Imzo siri. Hammaga ma'lum standart qiymat ishlatilmaydi:
 * env bo'lmasa har ishga tushishda tasodifiy sir yaratiladi.
 */
const SIGNING_SECRET =
  process.env.FILE_SIGNING_SECRET && process.env.FILE_SIGNING_SECRET.length >= 16
    ? process.env.FILE_SIGNING_SECRET
    : randomBytes(32).toString('hex');

export interface StreamInfo {
  masterPlaylist: string | null;
  directUrl: string | null;
  availableQualities: string[];
  defaultQuality: string;
  tokenExpiry: number;
}

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private readonly signingSecret = SIGNING_SECRET;
  private readonly hlsBase = process.env.NGINX_HLS_BASE_URL || 'http://localhost/hls';
  private readonly tokenTtlSeconds = 600;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Content) private contentRepo: Repository<Content>,
    @InjectRepository(Episode) private episodeRepo: Repository<Episode>,
    @InjectRepository(Receipt) private receiptRepo: Repository<Receipt>,
    private readonly hlsCache: HlsAuthCacheService,
  ) {}

  /** Foydalanuvchini tekshiradi: mavjud, bloklanmagan. */
  private async loadUser(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');
    if (user.isBanned) throw new ForbiddenException('Akkaunt bloklangan');
    return user;
  }

  /** Kontent pullikmi: faqat VIP yoki narxi bor. */
  private needsPayment(content: Content): boolean {
    return !!content.isPremium || Number(content.price || 0) > 0;
  }

  /** Shu kontent alohida sotib olingan va chek tasdiqlanganmi. */
  private async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    const count = await this.receiptRepo.count({
      where: {
        userId,
        contentId,
        type: ReceiptType.SINGLE_CONTENT,
        status: ReceiptStatus.APPROVED,
      },
    });
    return count > 0;
  }

  /**
   * Server tomonidagi yagona ruxsat qoidasi:
   *  - admin hammasini ko'radi;
   *  - bepul kontent hammaga ochiq;
   *  - VIP'ga kiradigan kontentni faol VIP ko'radi;
   *  - alohida sotib olingan kontentni xaridor ko'radi.
   */
  private async canAccess(user: User, content: Content): Promise<boolean> {
    if (user.isAdmin) return true;
    if (!this.needsPayment(content)) return true;
    if (content.isVipIncluded !== false && user.isVipActive) return true;
    return this.hasPurchased(user.id, content.id);
  }

  private async loadContent(contentId: string): Promise<Content> {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Kontent topilmadi');
    return content;
  }

  async getContentStreamUrl(contentId: string, userId: string): Promise<StreamInfo> {
    const content = await this.loadContent(contentId);
    const user = await this.loadUser(userId);
    if (!(await this.canAccess(user, content))) {
      throw new ForbiddenException('Obuna kerak');
    }
    const base = content.hlsPath ? `${this.hlsBase}/${encodeURIComponent(contentId)}` : null;
    return this.buildStream(userId, base, content.videoUrl);
  }

  /**
   * Epizod uchun server tomonidagi tekshiruv:
   *  - epizod shu kontentga tegishli bo'lishi shart;
   *  - bepul epizod hammaga ochiq (bloklanmaganlarga);
   *  - pullik epizod faqat ruxsati borlarga (VIP, xaridor, admin).
   */
  async getEpisodeStreamUrl(contentId: string, episodeId: string, userId: string): Promise<StreamInfo> {
    const episode = await this.episodeRepo.findOne({ where: { id: episodeId } });
    if (!episode || episode.contentId !== contentId) {
      throw new NotFoundException('Epizod topilmadi');
    }
    const content = await this.loadContent(contentId);
    const user = await this.loadUser(userId);
    if (!episode.isFree && !(await this.canAccess(user, content))) {
      throw new ForbiddenException('Bu qism uchun obuna kerak');
    }
    const epHls = (episode as unknown as { hlsPath?: string | null }).hlsPath;
    const base = epHls
      ? `${this.hlsBase}/${encodeURIComponent(contentId)}/episodes/${encodeURIComponent(episodeId)}`
      : null;
    return this.buildStream(userId, base, episode.videoUrl || null);
  }

  /** Video manzili faqat ruxsat tekshirilgandan keyin qaytariladi. */
  private buildStream(userId: string, hlsBaseUrl: string | null, direct: string | null): StreamInfo {
    const { token, exp } = this.generateToken(userId);
    return {
      masterPlaylist: hlsBaseUrl
        ? `${hlsBaseUrl}/master.m3u8?uid=${encodeURIComponent(userId)}&exp=${exp}&sig=${token}`
        : null,
      directUrl: direct || null,
      availableQualities: ['480p', '720p', '1080p'],
      defaultQuality: '720p',
      tokenExpiry: exp,
    };
  }

  async verifyStreamToken(uid: string, exp: string, sig: string): Promise<boolean> {
    if (!uid || !exp || !sig) return false;
    if (!/^[a-f0-9]{64}$/i.test(sig) || !/^\d{1,12}$/.test(exp) || uid.length > 64) return false;

    const cached = await this.hlsCache.getCached(uid, sig);
    if (cached === 'allow') {
      // Kesh bo'lsa ham muddat tekshiriladi
      return Date.now() / 1000 <= parseInt(exp, 10);
    }
    if (cached === 'deny') return false;

    const result = await this.verifyFromDb(uid, exp, sig);
    await this.hlsCache.setCached(uid, sig, result ? 'allow' : 'deny');
    return result;
  }

  private async verifyFromDb(uid: string, exp: string, sig: string): Promise<boolean> {
    const expNum = parseInt(exp, 10);
    const now = Date.now() / 1000;
    if (isNaN(expNum) || now > expNum || expNum - now > this.tokenTtlSeconds + 60) {
      return false;
    }

    const expectedSig = this.computeHmac(uid, exp);
    if (!this.safeEqual(sig.toLowerCase(), expectedSig)) {
      this.logger.warn(`Invalid stream sig for uid=${uid}`);
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

  private safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(String(a || ''));
    const y = Buffer.from(String(b || ''));
    if (x.length !== y.length) return false;
    return timingSafeEqual(x, y);
  }
}
