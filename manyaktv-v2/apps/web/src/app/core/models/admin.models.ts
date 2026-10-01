/**
 * Admin panel uchun umumiy tiplar.
 * Server javoblari ba'zan massiv, ba'zan { data: [...] } ko'rinishida keladi,
 * shuning uchun ListResponse va toList() yordamchisi bor.
 */

export type Id = string;

export interface ListEnvelope<T> {
  data?: T[];
  items?: T[];
  catalogs?: T[];
}

export type ListResponse<T> = T[] | ListEnvelope<T> | null | undefined;

/** Har qanday ro'yxat javobini oddiy massivga aylantiradi. */
export function toList<T>(r: ListResponse<T>): T[] {
  if (Array.isArray(r)) { return r; }
  if (!r) { return []; }
  return r.data || r.items || r.catalogs || [];
}

/** Bosh sahifadagi katalog (bo'lim). */
export interface Catalog {
  id: string;
  title: string;
  isVisible: boolean;
  order: number;
}

/** VIP tarif. Eski versiyadan kelgan title/days maydonlari ham qo'llab-quvvatlanadi. */
export interface Plan {
  id?: Id;
  name?: string;
  title?: string;
  price?: number;
  durationDays?: number;
  days?: number;
  description?: string;
  isActive?: boolean;
}

export interface PromoCode {
  id: Id;
  code: string;
  discountPercent?: number;
  discount?: number;
  maxUses?: number;
  usedCount?: number;
  createdAt?: string;
}

export interface PromoCodeCreate {
  code: string;
  discountPercent: number;
  maxUses: number;
}

export interface AppSettings {
  botUsername: string;
  channelUrl: string;
  adminContactUrl: string;
  webAppUrl: string;
  cardNumber: string;
  cardHolder: string;
}

export interface AuditLog {
  id?: Id;
  action?: string;
  type?: string;
  createdAt?: string;
  timestamp?: string;
  actorName?: string;
  adminName?: string;
  actorId?: string | number;
  adminId?: string | number;
  description?: string;
  details?: string;
}

export type MoneyValue = number | string | null | undefined;

/* ------------------------------------------------------------------ */
/* Kontent, epizod, chek va foydalanuvchi (API entity'lariga mos)       */
/* ------------------------------------------------------------------ */

export type UserRole = 'user' | 'admin' | 'super_admin';

/** Foydalanuvchi (API: users jadvali). Sanalar JSON'da satr bo'lib keladi. */
export interface AppUser {
  id: Id;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isVip: boolean;
  vipExpiresAt?: string | null;
  subscriptionPlanId?: string | null;
  isPhoneVerified?: boolean;
  phoneNumber?: string | null;
  isBanned: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  createdAt?: string;
  lastSeenAt?: string | null;
}

/** Serial qismi (API: episodes jadvali). */
export interface Episode {
  id: Id;
  contentId: Id;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  videoUrl?: string | null;
  hlsPath?: string | null;
  transcodeStatus?: string;
  availableQualities?: string[];
  duration?: string | null;
  isFree: boolean;
  viewsCount?: number;
  thumbnailUrl?: string | null;
  createdAt?: string;
}

/** Film yoki serial (API: contents jadvali). Qo'shimcha maydonlar ixtiyoriy. */
export interface Content {
  id: Id;
  title: string;
  description?: string | null;
  type?: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  videoUrl?: string | null;
  hlsPath?: string | null;
  isPremium: boolean;
  genres?: string[];
  year?: number | null;
  rating?: number | null;
  viewsCount?: number;
  episodes?: Episode[];
  createdAt?: string;
}

export type ReceiptStatus = 'pending' | 'approved' | 'rejected';

/** To'lov cheki (API: receipts jadvali). */
export interface Receipt {
  id: Id;
  userId: Id;
  user?: Pick<AppUser, 'id' | 'firstName' | 'lastName' | 'username' | 'telegramId'> | null;
  planId?: Id | null;
  plan?: Plan | null;
  contentId?: Id | null;
  amount?: MoneyValue;
  imageUrl?: string | null;
  status: ReceiptStatus;
  rejectReason?: string | null;
  createdAt?: string;
  reviewedAt?: string | null;
}
