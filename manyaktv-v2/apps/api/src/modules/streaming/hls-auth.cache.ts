import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * HLS Auth Cache (Redis).
 * Validatsiya natijasini 30 soniya saqlaydi, DB load ~30x kamayadi.
 */
@Injectable()
export class HlsAuthCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(HlsAuthCacheService.name);
  private readonly TTL_SECONDS = parseInt(process.env.HLS_AUTH_CACHE_TTL || '30', 10);
  private readonly PREFIX = 'hls:auth:';
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>('app.redis.url') || process.env.REDIS_URL;
    this.redis = url
      ? new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 })
      : new Redis({
          host: config.get<string>('app.redis.host', 'localhost'),
          port: config.get<number>('app.redis.port', 6379),
          password: config.get<string>('app.redis.password'),
          lazyConnect: true,
          maxRetriesPerRequest: 2,
        });
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
    } catch {
      /* ignore */
    }
  }

  async getCached(uid: string, sig: string): Promise<'allow' | 'deny' | null> {
    try {
      const val = await this.redis.get(this.buildKey(uid, sig));
      return val as 'allow' | 'deny' | null;
    } catch (err) {
      this.logger.warn(`Redis get error: ${err}`);
      return null;
    }
  }

  async setCached(uid: string, sig: string, result: 'allow' | 'deny'): Promise<void> {
    try {
      const ttl = result === 'deny' ? 5 : this.TTL_SECONDS;
      await this.redis.set(this.buildKey(uid, sig), result, 'EX', ttl);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err}`);
    }
  }

  async invalidateUser(uid: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.PREFIX}${uid}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Invalidated ${keys.length} HLS cache keys for user ${uid}`);
      }
    } catch (err) {
      this.logger.warn(`Redis invalidate error: ${err}`);
    }
  }

  private buildKey(uid: string, sig: string): string {
    return `${this.PREFIX}${uid}:${sig.slice(0, 16)}`;
  }
}
