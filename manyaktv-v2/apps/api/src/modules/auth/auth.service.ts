import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User, UserRole } from '../users/entities/user.entity';
import { VerifyDto } from './dto/verify.dto';

export interface TelegramWebAppData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

@Injectable()
export class AuthService {
  private readonly botToken: string;
  private readonly superAdminIds: Set<string>;
  private readonly additionalAdminIds: Set<string>;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.botToken = this.config.get<string>('telegram.botToken', '');
    const superAdminId = this.config.get<string>('telegram.superAdminId', '');
    this.superAdminIds = new Set(superAdminId ? [superAdminId] : []);
    const additionalIds = (this.config.get<string>('telegram.additionalAdminIds', '') || '')
      .split(',').map((id) => id.trim()).filter(Boolean);
    this.additionalAdminIds = new Set(additionalIds);
  }

  /** Vaqtga bog'liq hujumlardan himoyalangan solishtirish */
  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  }

  async verifyTelegram(dto: VerifyDto): Promise<{ token: string; user: User }> {
    const userData = this.validateInitData(dto.initData);
    if (!userData) throw new UnauthorizedException('Invalid Telegram initData');

    const telegramId = String(userData.id);
    let user = await this.userRepo.findOne({ where: { telegramId } });

    if (!user) {
      user = this.userRepo.create({
        id: telegramId, telegramId,
        firstName: userData.first_name,
        lastName: userData.last_name ?? null,
        username: userData.username ?? null,
        avatarUrl: userData.photo_url ?? null,
        role: this.resolveRole(telegramId),
        lastSeenAt: new Date(),
      });
      user = await this.userRepo.save(user);
    } else {
      if (user.isBanned) throw new ForbiddenException('Your account is banned');
      user.firstName = userData.first_name;
      user.lastName = userData.last_name ?? null;
      user.username = userData.username ?? null;
      user.lastSeenAt = new Date();
      // Bosh admin ID si har doim bosh admin bo'lib qoladi
      if (this.superAdminIds.has(telegramId) && user.role !== UserRole.SUPER_ADMIN) {
        user.role = UserRole.SUPER_ADMIN;
      }
      user = await this.userRepo.save(user);
    }

    if (dto.hwid && user.hwid && user.hwid !== dto.hwid)
      throw new ForbiddenException('Device mismatch');
    if (dto.hwid && !user.hwid) {
      user.hwid = dto.hwid;
      user = await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { token, user };
  }

  validateInitData(initData: string): TelegramWebAppData | null {
    try {
      if (!initData || initData.length > 4096 || !this.botToken) return null;
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      if (!hash) return null;
      params.delete('hash');
      const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`).join('\n');
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(this.botToken).digest();
      const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      if (!this.safeEqual(expectedHash, hash)) return null;
      const authDate = parseInt(params.get('auth_date') || '0', 10);
      const nowSec = Math.floor(Date.now() / 1000);
      if (!authDate || nowSec - authDate > 300 || authDate - nowSec > 60) return null;
      const userParam = params.get('user');
      if (!userParam) return null;
      const parsed = JSON.parse(decodeURIComponent(userParam)) as TelegramWebAppData;
      if (!parsed || !parsed.id) return null;
      return parsed;
    } catch { return null; }
  }

  private resolveRole(telegramId: string): UserRole {
    if (this.superAdminIds.has(telegramId)) return UserRole.SUPER_ADMIN;
    if (this.additionalAdminIds.has(telegramId)) return UserRole.ADMIN;
    return UserRole.USER;
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async adminBrowserLogin(dto: { telegramId: string; secret: string }): Promise<{ token: string; user: User }> {
    const expectedSecret = this.config.get<string>('app.adminBrowserSecret', '');
    if (!expectedSecret || !this.safeEqual(String(dto.secret || ''), expectedSecret))
      throw new UnauthorizedException('Invalid credentials');

    const user = await this.userRepo.findOne({ where: { telegramId: String(dto.telegramId || '') } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)
      throw new ForbiddenException('Access denied: admin only');

    if (user.isBanned) throw new ForbiddenException('Account is banned');

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { token, user };
  }
}
