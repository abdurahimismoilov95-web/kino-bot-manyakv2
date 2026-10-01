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
