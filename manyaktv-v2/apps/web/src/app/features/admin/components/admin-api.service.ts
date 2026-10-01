import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AppSettings,
  AuditLog,
  Catalog,
  ListResponse,
  Plan,
  PromoCode,
  PromoCodeCreate,
  toList,
} from '../../../core/models/admin.models';

/**
 * manyak-tv1 AdminPanel.tsx dagi barcha bolimlar uchun umumiy admin API.
 * Ro'yxat javoblari shu yerda massivga keltiriladi, komponentlar tayyor tipli massiv oladi.
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /**
   * Telegram tugmalari uchun web app manzili.
   * Tartib: sozlamalardagi webAppUrl -> environment.webAppUrl -> joriy manzil.
   */
  static cleanOrigin(u: string | null | undefined): string {
    const s = String(u || '').trim().replace(/\/+$/, '');
    return /^https:\/\/[^\s]+$/i.test(s) ? s : '';
  }
  static defaultWebOrigin(): string {
    return AdminApiService.cleanOrigin(environment.webAppUrl) || window.location.origin;
  }

  // Kontent (admin uchun to'liq, video manzillari bilan)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContentList(limit = 100): Observable<any> {
    return this.http.get(this.base + '/content/admin/all', { params: { page: '1', limit: String(limit) } });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContentFull(id: string): Observable<any> {
    return this.http.get(this.base + '/content/' + encodeURIComponent(id) + '/full');
  }

  // Kataloglar (ekran bolimlari)
  getCatalogs(): Observable<Catalog[]> {
    return this.http.get<ListResponse<Catalog>>(this.base + '/admin/catalogs').pipe(map((r) => toList(r)));
  }
  saveCatalogs(catalogs: Catalog[]): Observable<unknown> {
    return this.http.put<unknown>(this.base + '/admin/catalogs', { catalogs });
  }

  // Tariflar
  getPlans(): Observable<Plan[]> {
    return this.http.get<ListResponse<Plan>>(this.base + '/plans').pipe(map((r) => toList(r)));
  }
  savePlan(plan: Plan): Observable<Plan> {
    if (plan.id) {
      return this.http.patch<Plan>(this.base + '/admin/plans/' + encodeURIComponent(plan.id), plan);
    }
    return this.http.post<Plan>(this.base + '/admin/plans', plan);
  }
  deletePlan(id: string): Observable<unknown> {
    return this.http.delete<unknown>(this.base + '/admin/plans/' + encodeURIComponent(id));
  }

  // Promokodlar
  getPromos(): Observable<PromoCode[]> {
    return this.http.get<ListResponse<PromoCode>>(this.base + '/admin/promo-codes').pipe(map((r) => toList(r)));
  }
  createPromo(body: PromoCodeCreate): Observable<PromoCode> {
    return this.http.post<PromoCode>(this.base + '/admin/promo-codes', body);
  }
  deletePromo(id: string): Observable<unknown> {
    return this.http.delete<unknown>(this.base + '/admin/promo-codes/' + encodeURIComponent(id));
  }

  // Xabar yuborish (broadcast komponenti keyingi bosqichda tiplanadi)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcast(body: Record<string, unknown>): Observable<any> {
    return this.http.post(this.base + '/admin/broadcast', body);
  }

  // Bot va havolalar sozlamalari
  getSettings(): Observable<Partial<AppSettings> | null> {
    return this.http.get<Partial<AppSettings> | null>(this.base + '/admin/settings');
  }
  saveSettings(body: AppSettings): Observable<unknown> {
    return this.http.put<unknown>(this.base + '/admin/settings', body);
  }

  // Audit jurnali
  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<ListResponse<AuditLog>>(this.base + '/admin/audit-logs').pipe(map((r) => toList(r)));
  }

  // Adminlar (faqat bosh admin) - admins komponenti keyingi bosqichda tiplanadi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAdmins(): Observable<any> {
    return this.http.get(this.base + '/admin/admins');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addAdmin(telegramId: string): Observable<any> {
    return this.http.post(this.base + '/admin/admins', { telegramId });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeAdmin(id: string): Observable<any> {
    return this.http.delete(this.base + '/admin/admins/' + encodeURIComponent(id));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAdminLogs(id: string): Observable<any> {
    return this.http.get(this.base + '/admin/admins/' + encodeURIComponent(id) + '/logs');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockAdmin(id: string, reason: string): Observable<any> {
    return this.http.post(this.base + '/admin/admins/' + encodeURIComponent(id) + '/block', { reason });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unblockAdmin(id: string): Observable<any> {
    return this.http.post(this.base + '/admin/admins/' + encodeURIComponent(id) + '/unblock', {});
  }
}
