import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

/**
 * HLS Auth Cache — Redis
 *
 * MUAMMO: auth_request har .ts segmentga NestJS ni chaqiradi.
 * 840 streamer × 0.25 req/s = 210 req/s FAQAT AUTH uchun.
 *
 * YECHIM: Validatsiya natijasini Redis da 30 soniya saqlash.
 * Birinchi request → DB tekshiradi, keyingilari → Redis dan oladi.
 * DB load: 210 req/s → 7 req/s (30x kamaydi).
 */
@Injectable()
export class HlsAuthCacheService {
  private readonly logger = new Logger(HlsAuthCacheService.name);
  private readonly TTL_SECONDS = parseInt(process.env.HLS_AUTH_CACHE_TTL || '30');
  private readonly PREFIX = 'hls:auth:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Cache dan HLS token natijasini olish
   * @returns 'allow' | 'deny' | null (null = cache miss)
   */
  async getCached(uid: string, sig: string): Promise<'allow' | 'deny' | null> {
    const key = this.buildKey(uid, sig);
    try {
      const val = await this.redis.get(key);
      return val as 'allow' | 'deny' | null;
    } catch (err) {
      this.logger.warn(`Redis get error: ${err}`);
      return null;  // Cache miss → DB dan tekshir
    }
  }

  /**
   * Natijani Redis da saqlash
   */
  async setCached(uid: string, sig: string, result: 'allow' | 'deny'): Promise<void> {
    const key = this.buildKey(uid, sig);
    try {
      // 'deny' natijasini qisqaroq saqlash (5s) — tezroq bloklash uchun
      const ttl = result === 'deny' ? 5 : this.TTL_SECONDS;
      await this.redis.set(key, result, 'EX', ttl);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err}`);
    }
  }

  /**
   * Foydalanuvchi ban bo'lganda barcha tokenlarini bekor qilish
   */
  async invalidateUser(uid: string): Promise<void> {
    try {
      const pattern = `${this.PREFIX}${uid}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Invalidated ${keys.length} HLS cache keys for user ${uid}`);
      }
    } catch (err) {
      this.logger.warn(`Redis invalidate error: ${err}`);
    }
  }

  private buildKey(uid: string, sig: string): string {
    // Key: hls:auth:{uid}:{sig_first_16_chars}
    return `${this.PREFIX}${uid}:${sig.slice(0, 16)}`;
  }
}
