import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { NotificationService } from './notification.service';

/**
 * RedisListenerService
 * Bot microservice Redis channel'ini tinglaydi.
 * API NestJS tomonidan publish qilingan event'larni qabul qiladi.
 *
 * Afzallik: Bot alohida process bo'lgani uchun:
 *   - API va Bot mustaqil scale bo'la oladi
 *   - Bot token faqat bot processida - conflict yo'q
 *   - API crash bo'lsa bot ishlashda davom etadi
 */
@Injectable()
export class RedisListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisListenerService.name);
  private subscriber: Redis;
  private readonly CHANNEL = 'manyaktv:events';

  constructor(
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    this.subscriber = new Redis({
      host:     this.config.get('REDIS_HOST', 'localhost'),
      port:     this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD'),
      lazyConnect: true,
    });

    await this.subscriber.connect();
    await this.subscriber.subscribe(this.CHANNEL);

    this.subscriber.on('message', async (_channel, message) => {
      try {
        const event = JSON.parse(message) as { type: string; payload: any; userId?: string };
        await this.handleEvent(event);
      } catch (err) {
        this.logger.error('Failed to handle Redis event:', err);
      }
    });

    this.logger.log(`Listening on Redis channel: ${this.CHANNEL}`);
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
  }

  private async handleEvent(event: { type: string; payload: any; userId?: string }) {
    this.logger.debug(`Event received: ${event.type}`);

    switch (event.type) {
      case 'payment.approved':
        if (event.userId) {
          await this.notificationService.notifyPaymentApproved(event.userId, {
            planName:    event.payload.planName,
            durationDays: event.payload.durationDays,
          });
        }
        break;

      case 'payment.rejected':
        if (event.userId) {
          await this.notificationService.notifyPaymentRejected(
            event.userId,
            event.payload.reason,
          );
        }
        break;

      // Kelajakda: content.added, broadcast.message, etc.
      default:
        break;
    }
  }
}
