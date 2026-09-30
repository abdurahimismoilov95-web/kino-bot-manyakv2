import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * manyak-tv1 AdminPanel.tsx dagi barcha bolimlar uchun umumiy admin API.
 * ApiService da mavjud bolmagan endpointlar shu yerda.
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // Kataloglar (ekran bolimlari)
  getCatalogs(): Observable<any> {
    return this.http.get<any>(this.base + '/admin/catalogs');
  }
  saveCatalogs(catalogs: any[]): Observable<any> {
    return this.http.put<any>(this.base + '/admin/catalogs', { catalogs });
  }

  // Tariflar
  getPlans(): Observable<any> {
    return this.http.get<any>(this.base + '/plans');
  }
  savePlan(plan: any): Observable<any> {
    if (plan && plan.id) {
      return this.http.patch<any>(this.base + '/admin/plans/' + plan.id, plan);
    }
    return this.http.post<any>(this.base + '/admin/plans', plan);
  }
  deletePlan(id: string): Observable<any> {
    return this.http.delete<any>(this.base + '/admin/plans/' + id);
  }

  // Promokodlar
  getPromos(): Observable<any> {
    return this.http.get<any>(this.base + '/admin/promo-codes');
  }
  createPromo(body: any): Observable<any> {
    return this.http.post<any>(this.base + '/admin/promo-codes', body);
  }
  deletePromo(id: string): Observable<any> {
    return this.http.delete<any>(this.base + '/admin/promo-codes/' + id);
  }

  // Xabar yuborish
  broadcast(body: any): Observable<any> {
    return this.http.post<any>(this.base + '/admin/broadcast', body);
  }

  // Bot va havolalar sozlamalari
  getSettings(): Observable<any> {
    return this.http.get<any>(this.base + '/admin/settings');
  }
  saveSettings(body: any): Observable<any> {
    return this.http.put<any>(this.base + '/admin/settings', body);
  }

  // Audit jurnali
  getAuditLogs(): Observable<any> {
    return this.http.get<any>(this.base + '/admin/audit-logs');
  }

  // Adminlar (faqat bosh admin)
  getAdmins(): Observable<any> {
    return this.http.get<any>(this.base + '/admin/admins');
  }
  addAdmin(telegramId: string): Observable<any> {
    return this.http.post<any>(this.base + '/admin/admins', { telegramId });
  }
  removeAdmin(id: string): Observable<any> {
    return this.http.delete<any>(this.base + '/admin/admins/' + id);
  }
  getAdminLogs(id: string): Observable<any> {
    return this.http.get<any>(this.base + '/admin/admins/' + id + '/logs');
  }
  blockAdmin(id: string, reason: string): Observable<any> {
    return this.http.post<any>(this.base + '/admin/admins/' + id + '/block', { reason });
  }
  unblockAdmin(id: string): Observable<any> {
    return this.http.post<any>(this.base + '/admin/admins/' + id + '/unblock', {});
  }
}
