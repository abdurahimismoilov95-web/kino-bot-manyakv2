import {
  Entity, PrimaryColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { WatchHistory } from '../../content/entities/watch-history.entity';
import { Favorite } from '../../content/entities/favorite.entity';
import { Receipt } from '../../payment/entities/receipt.entity';

export enum UserRole {
  USER  = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
@Index(['telegramId'], { unique: true })
export class User {
  /** Telegram user ID (string — Telegram ID 64-bit safe) */
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id: string;

  @Column({ name: 'telegram_id', type: 'varchar', length: 32, unique: true })
  telegramId: string;

  @Column({ name: 'first_name', type: 'varchar', length: 128 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 128, nullable: true })
  lastName: string | null;

  @Column({ name: 'username', type: 'varchar', length: 64, nullable: true })
  @Index()
  username: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // ─── Subscription ──────────────────────────────────────────────────
  @Column({ name: 'is_vip', type: 'boolean', default: false })
  isVip: boolean;

  @Column({ name: 'vip_expires_at', type: 'timestamptz', nullable: true })
  vipExpiresAt: Date | null;

  @Column({ name: 'subscription_plan_id', type: 'varchar', nullable: true })
  subscriptionPlanId: string | null;

  @Column({ name: 'tokens', type: 'int', default: 0 })
  tokens: number;

  // ─── Verification & Security ──────────────────────────────────────
  @Column({ name: 'is_phone_verified', type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  /** Hardware fingerprint — biriktirilgan qurilma */
  @Column({ name: 'hwid', type: 'text', nullable: true })
  hwid: string | null;

  /** Ban */
  @Column({ name: 'is_banned', type: 'boolean', default: false })
  isBanned: boolean;

  @Column({ name: 'ban_reason', type: 'text', nullable: true })
  banReason: string | null;

  @Column({ name: 'banned_at', type: 'timestamptz', nullable: true })
  bannedAt: Date | null;

  // ─── Daily check-in ────────────────────────────────────────────────
  @Column({ name: 'checkin_streak', type: 'int', default: 0 })
  checkinStreak: number;

  @Column({ name: 'last_checkin_date', type: 'date', nullable: true })
  lastCheckinDate: string | null;

  // ─── Relations ──────────────────────────────────────────────────
  @OneToMany(() => WatchHistory, (h) => h.user)
  watchHistory: WatchHistory[];

  @OneToMany(() => Favorite, (f) => f.user)
  favorites: Favorite[];

  @OneToMany(() => Receipt, (r) => r.user)
  receipts: Receipt[];

  // ─── Timestamps ──────────────────────────────────────────────────
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  // ─── Computed helpers ──────────────────────────────────────────────
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  get isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN;
  }

  get isVipActive(): boolean {
    if (!this.isVip) return false;
    if (!this.vipExpiresAt) return true; // Lifetime
    return new Date() < this.vipExpiresAt;
  }
}
