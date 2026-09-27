import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResult<User>> {
    const where = search
      ? [
          { firstName: ILike(`%${search}%`) },
          { username: ILike(`%${search}%`) },
          { telegramId: search },
        ]
      : {};

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async grantVip(userId: string, durationDays: number): Promise<User> {
    const user = await this.findById(userId);
    const now = new Date();
    const currentExpiry = user.vipExpiresAt && user.vipExpiresAt > now
      ? user.vipExpiresAt
      : now;
    user.isVip = true;
    user.vipExpiresAt = new Date(
      currentExpiry.getTime() + durationDays * 86400000,
    );
    return this.repo.save(user);
  }

  async revokeVip(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.isVip = false;
    user.vipExpiresAt = null;
    user.subscriptionPlanId = null;
    return this.repo.save(user);
  }

  async banUser(userId: string, reason: string, adminId: string): Promise<User> {
    const user = await this.findById(userId);
    if (user.isAdmin) throw new BadRequestException('Cannot ban admin user');
    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    return this.repo.save(user);
  }

  async unbanUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    return this.repo.save(user);
  }

  async resetHwid(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.hwid = null;
    return this.repo.save(user);
  }

  async setRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    user.role = role;
    return this.repo.save(user);
  }

  async getStats() {
    const [total, vip, banned] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { isVip: true } }),
      this.repo.count({ where: { isBanned: true } }),
    ]);
    return { total, vip, banned, free: total - vip };
  }

  async dailyCheckin(userId: string): Promise<{ tokensEarned: number; streak: number }> {
    const user = await this.findById(userId);
    const today = new Date().toISOString().split('T')[0];

    if (user.lastCheckinDate === today) {
      throw new ConflictException('Already checked in today');
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const streak = user.lastCheckinDate === yesterday ? user.checkinStreak + 1 : 1;

    const tokensEarned = streak % 7 === 0 ? 20 : 10;

    user.tokens += tokensEarned;
    user.checkinStreak = streak;
    user.lastCheckinDate = today;

    await this.repo.save(user);
    return { tokensEarned, streak };
  }
}
