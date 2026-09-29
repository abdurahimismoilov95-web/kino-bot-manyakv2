import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../users/entities/user.entity';

export type VerifySession = {
  code: string;
  createdAt: number;
  verified: boolean;
  userId?: string;
  token?: string;
};

export type TelegramFrom = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramContact = {
  user_id?: number;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
};

/** Kod 10 daqiqa yashaydi */
const TTL_MS = 10 * 60 * 1000;

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);
  private readonly sessions = new Map<string, VerifySession>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private sweep(): void {
    const now = Date.now();
    for (const [code, s] of this.sessions) {
      if (now - s.createdAt > TTL_MS) this.sessions.delete(code);
    }
  }

  private botUsername(): string {
    return (
      process.env.TELEGRAM_BOT_USERNAME ||
      this.config.get<string>('telegram.botUsername') ||
      'Manyaktvbot'
    ).replace('@', '');
  }

  private newCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  start(): { code: string; deepLink: string; expiresIn: number } {
    this.sweep();
    const code = this.newCode();
    this.sessions.set(code, { code, createdAt: Date.now(), verified: false });
    return {
      code,
      deepLink: 'https://t.me/' + this.botUsername() + '?start=v_' + code,
      expiresIn: Math.floor(TTL_MS / 1000),
    };
  }

  has(code: string): boolean {
    this.sweep();
    return this.sessions.has(code);
  }

  async status(code: string): Promise<{
    verified: boolean;
    expired?: boolean;
    status?: string;
    token?: string;
    user?: Partial<User>;
  }> {
    this.sweep();
    const session = this.sessions.get(code);
    if (!session) return { verified: false, expired: true, status: 'expired' };
    if (!session.verified || !session.userId) return { verified: false };

    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    if (!user) return { verified: false };

    const token = session.token;
    this.sessions.delete(code);

    return { verified: true, token, user };
  }

  private resolveRole(telegramId: string): UserRole {
    const superAdminId = (
      this.config.get<string>('telegram.superAdminId') ||
      process.env.SUPER_ADMIN_ID ||
      ''
    ).trim();
    if (superAdminId && superAdminId === telegramId) return UserRole.SUPER_ADMIN;

    const extra = (
      this.config.get<string>('telegram.additionalAdminIds') ||
      process.env.ADDITIONAL_ADMIN_IDS ||
      ''
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (extra.includes(telegramId)) return UserRole.ADMIN;

    return UserRole.USER;
  }

  async completeByContact(
    code: string,
    from: TelegramFrom,
    contact: TelegramContact,
  ): Promise<{ ok: boolean; reason?: string }> {
    this.sweep();
    const session = this.sessions.get(code);
    if (!session) return { ok: false, reason: 'expired' };

    if (!from?.id || !contact?.user_id) return { ok: false, reason: 'no_contact' };
    if (Number(contact.user_id) !== Number(from.id)) {
      return { ok: false, reason: 'foreign_contact' };
    }

    const telegramId = String(from.id);
    const phone = contact.phone_number
      ? String(contact.phone_number).slice(0, 20)
      : null;
    let user = await this.userRepo.findOne({ where: { telegramId } });

    if (!user) {
      user = this.userRepo.create({
        id: telegramId,
        telegramId,
        firstName: from.first_name || contact.first_name || 'Foydalanuvchi',
        lastName: from.last_name ?? contact.last_name ?? null,
        username: from.username ?? null,
        role: this.resolveRole(telegramId),
        lastSeenAt: new Date(),
      });
    } else {
      if (user.isBanned) return { ok: false, reason: 'banned' };
      user.firstName = from.first_name || user.firstName;
      user.lastName = from.last_name ?? user.lastName;
      user.username = from.username ?? user.username;
      user.lastSeenAt = new Date();
    }

    (user as any).isPhoneVerified = true;
    if (phone) (user as any).phoneNumber = phone;
    user = await this.userRepo.save(user);

    session.verified = true;
    session.userId = user.id;
    session.token = this.jwtService.sign({ sub: user.id, role: user.role });
    this.sessions.set(code, session);

    this.logger.log('Tasdiqlandi: ' + telegramId + ' (' + code + ')');
    return { ok: true };
  }
}
