import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HlsStreamUrl {
  masterPlaylist: string;
  availableQualities: string[];
  defaultQuality: string;
  tokenExpiry: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private toParams(obj: Record<string, any>): HttpParams {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null) p = p.set(k, String(v));
    });
    return p;
  }

  // ─── Content (public) ────────────────────────────────────────
  /** BUG FIX: getContent(params) — ro'yxat olish (params object bilan) */
  getContent(params: Record<string, any> = {}): Observable<PaginatedResult<any>> {
    return this.http.get<PaginatedResult<any>>(`${this.base}/content`, { params: this.toParams(params) });
  }

  getFeatured(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/content/featured`);
  }

  getTrending(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/content/trending`);
  }

  /** Bitta kino/serial ma'lumoti ID bo'yicha */
  getContentById(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/content/${id}`);
  }

  // ─── HLS Streaming URL ─────────────────────────────────────
  getStreamUrl(contentId: string): Observable<HlsStreamUrl> {
    return this.http.get<HlsStreamUrl>(`${this.base}/streaming/content/${contentId}`);
  }

  getEpisodeStreamUrl(contentId: string, episodeId: string): Observable<HlsStreamUrl> {
    return this.http.get<HlsStreamUrl>(
      `${this.base}/streaming/content/${contentId}/episode/${episodeId}`,
    );
  }

  // ─── Watch Progress & History ──────────────────────────────
  saveProgress(
    contentId: string,
    body: { episodeId?: string; progressSeconds: number; durationSeconds: number },
  ): Observable<any> {
    return this.http.post(`${this.base}/content/${contentId}/watch-progress`, body);
  }

  getHistory(page = 1): Observable<PaginatedResult<any>> {
    return this.http.get<PaginatedResult<any>>(`${this.base}/content/history/mine`, {
      params: this.toParams({ page }),
    });
  }

  // ─── Favorites ──────────────────────────────────────────────
  toggleFavorite(contentId: string): Observable<{ added: boolean }> {
    return this.http.post<{ added: boolean }>(`${this.base}/content/${contentId}/favorite`, {});
  }

  getFavorites(page = 1): Observable<PaginatedResult<any>> {
    return this.http.get<PaginatedResult<any>>(`${this.base}/content/favorites/mine`, {
      params: this.toParams({ page }),
    });
  }

  // ─── Subscription ─────────────────────────────────────────
  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/subscriptions/plans`);
  }

  validatePromo(code: string, planId?: string): Observable<any> {
    return this.http.post(`${this.base}/subscriptions/validate-promo`, { code, planId });
  }

  createPlan(data: any): Observable<any> {
    return this.http.post(`${this.base}/subscriptions/plans`, data);
  }

  updatePlan(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.base}/subscriptions/plans/${id}`, data);
  }

  getPromoCodes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/subscriptions/promo-codes`);
  }

  createPromoCode(data: any): Observable<any> {
    return this.http.post(`${this.base}/subscriptions/promo-codes`, data);
  }

  // ─── Payments (user) ──────────────────────────────────────
  submitReceipt(data: any): Observable<any> {
    return this.http.post(`${this.base}/payments/receipts`, data);
  }

  getMyReceipts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/payments/receipts/mine`);
  }

  // ─── Payments (admin) ────────────────────────────────────
  getPendingReceipts(page = 1): Observable<PaginatedResult<any>> {
    return this.http.get<PaginatedResult<any>>(`${this.base}/payments/receipts/pending`, {
      params: this.toParams({ page }),
    });
  }

  approveReceipt(id: string): Observable<any> {
    return this.http.patch(`${this.base}/payments/receipts/${id}/approve`, {});
  }

  rejectReceipt(id: string, reason: string): Observable<any> {
    return this.http.patch(`${this.base}/payments/receipts/${id}/reject`, { reason });
  }

  // ─── Users (admin) ───────────────────────────────────────
  getUsers(params: Record<string, any> = {}): Observable<PaginatedResult<any>> {
    return this.http.get<PaginatedResult<any>>(`${this.base}/users`, { params: this.toParams(params) });
  }

  banUser(id: string, reason: string): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/ban`, { reason });
  }

  unbanUser(id: string): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/unban`, {});
  }

  grantVip(id: string, durationDays: number): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/grant-vip`, { durationDays });
  }

  revokeVip(id: string): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/revoke-vip`, {});
  }

  resetHwid(id: string): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/reset-hwid`, {});
  }

  // ─── Content (admin CRUD) ─────────────────────────────────
  createContent(data: any): Observable<any> {
    return this.http.post(`${this.base}/content`, data);
  }

  updateContent(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.base}/content/${id}`, data);
  }

  deleteContent(id: string): Observable<any> {
    return this.http.delete(`${this.base}/content/${id}`);
  }

  // ─── Admin dashboard ──────────────────────────────────────
  getAdminDashboard(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/dashboard`);
  }

  adminBroadcast(type: string, message: string): Observable<any> {
    return this.http.post(`${this.base}/admin/broadcast`, { type, message });
  }

  // ─── User (self) ─────────────────────────────────────────────
  getMe(): Observable<any> {
    return this.http.get<any>(`${this.base}/users/me`);
  }

  /** BUG FIX: profile.component dailyCheckin() deydi, lekin metod nomi checkin() — alias qo'shildi */
  dailyCheckin(): Observable<{ tokensEarned: number; streak: number }> {
    return this.checkin();
  }

  checkin(): Observable<{ tokensEarned: number; streak: number }> {
    return this.http.post<any>(`${this.base}/users/checkin`, {});
  }

  // ─── Upload ──────────────────────────────────────────────────
  uploadReceipt(file: File): Observable<{ url: string }> {
    const fd = new FormData();
    fd.append('receipt', file);
    return this.http.post<{ url: string }>(`${this.base}/upload/receipt`, fd);
  }

  uploadPoster(file: File): Observable<{ url: string }> {
    const fd = new FormData();
    fd.append('poster', file);
    return this.http.post<{ url: string }>(`${this.base}/upload/poster`, fd);
  }

  uploadVideo(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('video', file);
    return this.http.post<any>(`${this.base}/upload/video`, fd);
  }

  // ─── SSE Events stream ─────────────────────────────────────
  connectSse(token: string): EventSource {
    return new EventSource(`${this.base}/events/stream?access_token=${token}`);
  }
}
