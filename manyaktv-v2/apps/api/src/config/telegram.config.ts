import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  superAdminId: process.env.SUPER_ADMIN_ID || '',
  additionalAdminIds: process.env.ADDITIONAL_ADMIN_IDS || '',
}));
