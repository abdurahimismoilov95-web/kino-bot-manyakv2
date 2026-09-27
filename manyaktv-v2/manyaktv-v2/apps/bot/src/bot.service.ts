import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, GrammyError, HttpError } from 'grammy';

/**
 * BotService - grammY asosida Telegram bot
 *
 * MUHIM: Bu microservice alohida ishlaydi.
 * Bot token faqat SHU PROCESSDA bor - API processida token yo'q.
 * Shu tarzda parallel instancelarda token conflict bo'lmaydi.
 *
 * Scaling strategiyasi:
 *   - Webhook rejimida ishlatish (polling emas)
 *   - Bir nechta bot instance bo'lsa, webhook bitta endpoint'ga boradi
 *   - Redis orqali event coordination
 */
@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  public readonly bot: Bot;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN', '');
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not set!');
    }
    this.bot = new Bot(token);
    this.setupHandlers();
  }

  private setupHandlers() {
    const bot = this.bot;

    // /start command
    bot.command('start', async (ctx) => {
      const firstName = ctx.from?.first_name ?? 'do\'st';
      await ctx.reply(
        `Salom, ${firstName}! \n\n` +
        'Manyak TV ga xush kelibsiz!\n\n' +
        'Web app ni ochish uchun pastdagi tugmani bosing.',
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: 'Manyak TV ni Ochish',
                web_app: { url: this.config.get<string>('FRONTEND_URL', 'https://manyaktv.uz') },
              },
            ]],
          },
        },
      );
    });

    // /help command
    bot.command('help', async (ctx) => {
      await ctx.reply(
        'Yordam:\n\n' +
        '/start - Botni boshlash\n' +
        '/status - Obuna holatim\n' +
        '/support - Muammo bo\'lsa yozing',
      );
    });

    // Error handler
    bot.catch((err) => {
      const ctx = err.ctx;
      this.logger.error(`Error while handling update ${ctx.update.update_id}:`);
      const e = err.error;
      if (e instanceof GrammyError) {
        this.logger.error('Error in request:', e.description);
      } else if (e instanceof HttpError) {
        this.logger.error('Could not contact Telegram:', e);
      } else {
        this.logger.error('Unknown error:', e);
      }
    });
  }

  async onModuleInit() {
    // Webhook orqali ishlaymiz (polling emas - production uchun)
    const webhookUrl = this.config.get<string>('APP_URL', '');
    if (webhookUrl) {
      await this.bot.api.setWebhook(`${webhookUrl}/api/v1/bot/webhook`, {
        secret_token: this.config.get('TELEGRAM_WEBHOOK_SECRET'),
      });
      this.logger.log(`Webhook set to: ${webhookUrl}/api/v1/bot/webhook`);
    } else {
      // Development: polling
      this.bot.start();
      this.logger.log('Bot started in polling mode (development)');
    }
  }

  async onModuleDestroy() {
    await this.bot.stop();
  }

  /** Foydalanuvchiga to'g'ridan-to'g'ri xabar yuborish */
  async sendMessage(chatId: number | string, text: string, extra?: object) {
    try {
      await this.bot.api.sendMessage(Number(chatId), text, extra as any);
    } catch (err) {
      this.logger.error(`Failed to send message to ${chatId}:`, err);
    }
  }
}
