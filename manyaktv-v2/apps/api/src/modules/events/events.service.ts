import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Redis } from 'ioredis';

export interface AppEvent {
  type: string;
  payload: unknown;
  userId?: string;
}

/**
 * SSE EventsService - Redis Pub/Sub asosida.
 * Har qancha instance bolsa ham barcha SSE clientlar eventni oladi.
 */
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;
  private readonly eventSubject = new Subject<AppEvent>();
  private readonly CHANNEL = 'manyaktv:events';

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('app.redis.url');
    if (redisUrl) {
      this.publisher = new Redis(redisUrl, { lazyConnect: true });
      this.subscriber = new Redis(redisUrl, { lazyConnect: true });
    } else {
      const redisOpts = {
        host: this.config.get<string>('app.redis.host', 'localhost'),
        port: this.config.get<number>('app.redis.port', 6379),
        password: this.config.get<string>('app.redis.password'),
        lazyConnect: true,
      };
      this.publisher = new Redis(redisOpts);
      this.subscriber = new Redis(redisOpts);
    }
  }

  async onModuleInit() {
    await this.publisher.connect();
    await this.subscriber.connect();
    await this.subscriber.subscribe(this.CHANNEL);
    this.subscriber.on('message', (_channel, message) => {
      try {
        const event: AppEvent = JSON.parse(message);
        this.eventSubject.next(event);
      } catch {
        /* ignore malformed */
      }
    });
  }

  async onModuleDestroy() {
    this.eventSubject.complete();
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  async publish(event: AppEvent): Promise<void> {
    await this.publisher.publish(this.CHANNEL, JSON.stringify(event));
  }

  async publishToUser(userId: string, type: string, payload: unknown): Promise<void> {
    await this.publish({ type, payload, userId });
  }

  async broadcast(type: string, payload: unknown): Promise<void> {
    await this.publish({ type, payload });
  }

  getStream(userId: string): Observable<MessageEvent> {
    return this.eventSubject.pipe(
      filter((e) => !e.userId || e.userId === userId),
      map(
        (e) =>
          ({
            data: JSON.stringify({ type: e.type, payload: e.payload }),
          }) as MessageEvent,
      ),
    );
  }
}
