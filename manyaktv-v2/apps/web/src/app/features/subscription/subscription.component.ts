import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * To'lov sahifasi: VIP tarif yoki alohida kino sotib olish (vitrina).
 * tarif/kino -> promokod -> karta -> chek rasmi -> adminga yuborish.
 */
@Component({
  selector: 'app-subscription',
  template: `
    <div class="pay">
      <header class="ph">
        <button class="bk" (click)="back()">&#8592;</button>
        <h1>{{ isSingle ? 'Kino sotib olish' : 'VIP Obuna' }}</h1>
        <span class="sp"></span>
      </header>

      <div class="done" *ngIf="successMsg">
        <div class="done-i">&#10003;</div>
        <h2>Chek yuborildi</h2>
        <p>{{ successMsg }}</p>
        <p class="done-s">Admin tasdiqlagach faollashadi. Bot orqali xabar keladi.</p>
        <button class="b b-red wide" (click)="back()">Bosh sahifaga</button>
      </div>

      <div *ngIf="!successMsg">
        <section class="sec" *ngIf="isSingle">
          <p class="sec-t">1. Tanlangan kino</p>
          <div class="plan plan-on">
            <div>
              <p class="pl-n">{{ contentTitle }}</p>
              <p class="pl-d">Alohida sotib olish</p>
            </div>
            <div class="pl-r">
              <p class="pl-p">{{ money(contentPrice) }}</p>
              <p class="pl-c">UZS</p>
            </div>
          </div>
        </section>

        <section class="sec" *ngIf="!isSingle">
          <p class="sec-t">1. Tarifni tanlang</p>
          <p class="muted" *ngIf="loadingPlans">Yuklanmoqda...</p>

          <div
            class="plan"
            *ngFor="let p of plans"
            [class.plan-on]="selectedPlanId === planId(p)"
            (click)="selectPlan(p)">
            <div>
              <p class="pl-n">{{ p.name || p.title }}</p>
              <p class="pl-d">{{ p.durationDays || p.days }} kun{{ p.description ? ' &middot; ' + p.description : '' }}</p>
            </div>
            <div class="pl-r">
              <p class="pl-p">{{ money(p.price) }}</p>
              <p class="pl-c">UZS</p>
            </div>
          </div>

          <p class="muted" *ngIf="!loadingPlans && plans.length === 0">
            Tariflar yuklanmadi. Keyinroq urinib koring.
          </p>
        </section>

        <section class="sec">
          <p class="sec-t">2. Promokod (ixtiyoriy)</p>
          <div class="promo">
            <input
              class="in"
              [(ngModel)]="promoInput"
              [ngModelOptions]="{ standalone: true }"
              placeholder="MANYAK10" />
            <button class="b b-g" [disabled]="checkingPromo" (click)="applyPromo()">
              {{ checkingPromo ? '...' : 'Tekshirish' }}
            </button>
          </div>
          <p class="pm" [class.pm-err]="promoError" *ngIf="promoMsg">{{ promoMsg }}</p>
        </section>

        <section class="sec">
          <p class="sec-t">3. Tolov qiling</p>
          <div class="card">
            <p class="cd-l">Karta raqami</p>
            <div class="cd-row">
              <p class="cd-v">{{ cardNumber }}</p>
              <button class="b b-g" (click)="copy(cardNumber, 'card')">
                {{ copied === 'card' ? 'Nusxalandi' : 'Nusxalash' }}
              </button>
            </div>
            <p class="cd-h">{{ cardHolder }}</p>

            <div class="amt">
              <div>
                <p class="cd-l">Tolov summasi</p>
                <p class="amt-v">
                  <span class="old" *ngIf="discountPercent > 0">{{ money(basePrice) }}</span>
                  {{ money(finalPrice) }} UZS
                </p>
              </div>
              <button class="b b-g" (click)="copy(finalPrice + '', 'amount')">
                {{ copied === 'amount' ? 'Nusxalandi' : 'Nusxalash' }}
              </button>
            </div>
          </div>
        </section>

        <section class="sec">
          <p class="sec-t">4. Chek rasmini yuklang</p>

          <label class="drop">
            <input type="file" accept="image/*" (change)="onFile($event)" hidden />
            <span *ngIf="!previewUrl && !uploading">&#128247; Rasm tanlash</span>
            <span *ngIf="uploading">Yuklanmoqda... {{ uploadProgress }}%</span>
            <img *ngIf="previewUrl && !uploading" [src]="previewUrl" alt="chek" class="prev" />
          </label>
          <p class="pm pm-err" *ngIf="uploadError">{{ uploadError }}</p>

          <textarea
            class="ta"
            rows="3"
            [(ngModel)]="notes"
            [ngModelOptions]="{ standalone: true }"
            placeholder="Izoh (ixtiyoriy): tolov vaqti, karta oxirgi 4 raqami..."></textarea>

          <button class="b b-red wide" [disabled]="submitting || !receiptUrl" (click)="submit()">
            {{ submitting ? 'Yuborilmoqda...' : 'Chekni yuborish' }}
          </button>
          <p class="pm pm-err" *ngIf="submitError">{{ submitError }}</p>
          <p class="note">Chek yuborilgach admin 5-30 daqiqada tasdiqlaydi.</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .pay { min-height: 100dvh; background: #09090b; color: #fff; padding-bottom: calc(var(--nav-height, 68px) + 28px); }
    .ph { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; background: rgba(15,15,15,0.94); backdrop-filter: blur(10px);
          border-bottom: 1px solid #27272a; }
    .ph h1 { font-size: 1rem; font-weight: 800; margin: 0; }
    .bk { background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer; }
    .sp { width: 20px; }
    .sec { padding: 16px; }
    .sec-t { font-size: 0.78rem; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 10px; }
    .plan { display: flex; align-items: center; justify-content: space-between; gap: 12px;
            background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 9px; cursor: pointer; }
    .plan-on { border-color: #f59e0b; background: rgba(245,158,11,0.08); }
    .pl-n { font-size: 0.92rem; font-weight: 800; margin: 0; }
    .pl-d { font-size: 0.72rem; color: #a1a1aa; margin: 4px 0 0; }
    .pl-r { text-align: right; }
    .pl-p { font-size: 1rem; font-weight: 900; color: #fbbf24; margin: 0; }
    .pl-c { font-size: 0.62rem; color: #71717a; margin: 2px 0 0; }
    .promo { display: flex; gap: 8px; }
    .in { flex: 1; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 11px 13px;
          color: #fff; font-size: 0.85rem; outline: none; text-transform: uppercase; }
    .pm { font-size: 0.75rem; color: #34d399; margin: 8px 0 0; }
    .pm-err { color: #fca5a5; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 16px; }
    .cd-l { font-size: 0.68rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }
    .cd-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; }
    .cd-v { font-size: 1.05rem; font-weight: 900; letter-spacing: 0.12em; font-family: monospace; margin: 0; }
    .cd-h { font-size: 0.78rem; color: #d4d4d8; margin: 8px 0 0; }
    .amt { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px;
           margin-top: 14px; padding-top: 14px; border-top: 1px dashed #3f3f46; }
    .amt-v { font-size: 1.1rem; font-weight: 900; color: #34d399; margin: 5px 0 0; }
    .old { font-size: 0.8rem; color: #71717a; text-decoration: line-through; margin-right: 7px; font-weight: 600; }
    .drop { display: flex; align-items: center; justify-content: center; min-height: 128px;
            border: 2px dashed #3f3f46; border-radius: 14px; background: #121216;
            color: #a1a1aa; font-size: 0.84rem; cursor: pointer; overflow: hidden; }
    .prev { width: 100%; max-height: 260px; object-fit: contain; }
    .ta { width: 100%; margin-top: 12px; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 12px;
          padding: 11px 13px; color: #fff; font-size: 0.85rem; font-family: inherit; outline: none; resize: vertical; }
    .b { border: none; border-radius: 11px; padding: 11px 14px; font-size: 0.8rem; font-weight: 800; cursor: pointer; }
    .b-red { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
    .b-g { background: #27272a; color: #e4e4e7; }
    .b:disabled { opacity: 0.45; }
    .wide { width: 100%; margin-top: 14px; padding: 14px; font-size: 0.9rem; }
    .note { font-size: 0.68rem; color: #71717a; margin: 10px 0 0; text-align: center; }
    .muted { font-size: 0.78rem; color: #71717a; }
    .done { padding: 48px 24px; text-align: center; }
    .done-i { width: 68px; height: 68px; margin: 0 auto 16px; border-radius: 50%;
              background: rgba(16,163,74,0.16); color: #34d399; font-size: 1.9rem;
              display: flex; align-items: center; justify-content: center; }
    .done h2 { font-size: 1.15rem; font-weight: 900; margin: 0 0 8px; }
    .done p { font-size: 0.85rem; color: #d4d4d8; margin: 0; }
    .done-s { font-size: 0.75rem !important; color: #a1a1aa !important; margin-top: 10px !important; }
  `],
})
export class SubscriptionComponent implements OnInit {
  private readonly base = environment.apiUrl;

  plans: any[] = [];
  loadingPlans = false;
  selectedPlanId = '';

  isSingle = false;
  contentId = '';
  contentTitle = '';
  contentPrice = 0;

  promoInput = '';
  promoMsg = '';
  promoError = false;
  checkingPromo = false;
  discountPercent = 0;
  appliedPromo = '';

  previewUrl: string | null = null;
  receiptUrl = '';
  uploading = false;
  uploadProgress = 0;
  uploadError = '';
  notes = '';
  submitting = false;
  submitError = '';
  successMsg = '';

  copied = '';
  cardNumber = '8600 0000 0000 0000';
  cardHolder = 'MANYAK TV';

  private readonly MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const cid = qp.get('contentId');
    if (cid) {
      this.isSingle = true;
      this.contentId = cid;
      this.contentTitle = qp.get('title') || 'Kino';
      this.contentPrice = Number(qp.get('price') || 15000);
    } else {
      this.loadingPlans = true;
      this.http.get<any>(this.base + '/plans').subscribe({
        next: (r: any) => {
          this.loadingPlans = false;
          this.plans = Array.isArray(r) ? r : (r && r.data) || [];
          if (this.plans.length > 0) { this.selectedPlanId = this.planId(this.plans[0]); }
        },
        error: () => { this.loadingPlans = false; },
      });
    }

    this.http.get<any>(this.base + '/settings').subscribe({
      next: (r: any) => {
        if (r && r.cardNumber) { this.cardNumber = r.cardNumber; }
        if (r && r.cardHolder) { this.cardHolder = r.cardHolder; }
      },
      error: () => {},
    });
  }

  planId(p: any): string {
    return String((p && (p.id || p.code)) || '');
  }

  selectPlan(p: any): void {
    this.selectedPlanId = this.planId(p);
  }

  get selectedPlan(): any {
    return this.plans.find((p: any) => this.planId(p) === this.selectedPlanId) || null;
  }

  get basePrice(): number {
    if (this.isSingle) { return this.contentPrice; }
    const p = this.selectedPlan;
    return Number((p && p.price) || 0);
  }

  get finalPrice(): number {
    const d = this.discountPercent > 0 ? this.discountPercent : 0;
    return Math.max(0, Math.round(this.basePrice * (100 - d) / 100));
  }

  money(v: any): string {
    try { return Number(v || 0).toLocaleString('ru-RU'); } catch { return String(v || 0); }
  }

  applyPromo(): void {
    const code = this.promoInput.trim().toUpperCase();
    if (!code) { return; }
    this.checkingPromo = true;
    this.promoMsg = '';
    this.http.post<any>(this.base + '/promo-codes/validate', { code: code }).subscribe({
      next: (r: any) => {
        this.checkingPromo = false;
        const pct = Number((r && (r.discountPercent || r.discount)) || 0);
        if (r && (r.valid === false)) {
          this.promoError = true;
          this.promoMsg = 'Promokod yaroqsiz.';
          this.discountPercent = 0;
          return;
        }
        this.promoError = false;
        this.discountPercent = pct;
        this.appliedPromo = code;
        this.promoMsg = 'Promokod qollandi: -' + pct + '%';
      },
      error: () => {
        this.checkingPromo = false;
        this.promoError = true;
        this.promoMsg = 'Promokod topilmadi yoki muddati tugagan.';
        this.discountPercent = 0;
      },
    });
  }

  copy(text: string, kind: string): void {
    const clean = String(text || '').replace(/\s+/g, '');
    const nav: any = navigator as any;
    if (nav && nav.clipboard && nav.clipboard.writeText) {
      nav.clipboard.writeText(clean);
    }
    this.copied = kind;
    setTimeout(() => { this.copied = ''; }, 1800);
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input && input.files && input.files[0];
    if (!file) { return; }
    this.uploadError = '';

    if (file.size > this.MAX_RECEIPT_BYTES) {
      this.uploadError = 'Rasm juda katta (8 MB dan oshmasin).';
      return;
    }
    if (file.type.indexOf('image/') !== 0) {
      this.uploadError = 'Faqat rasm fayli yuklanadi.';
      return;
    }

    this.previewUrl = URL.createObjectURL(file);
    this.uploading = true;
    this.uploadProgress = 10;

    const form = new FormData();
    form.append('file', file, file.name);

    this.http.post<any>(this.base + '/upload/receipt', form).subscribe({
      next: (r: any) => {
        this.uploading = false;
        this.uploadProgress = 100;
        this.receiptUrl = (r && (r.url || r.path || r.fileUrl)) || '';
        if (!this.receiptUrl) { this.uploadError = 'Server rasm manzilini qaytarmadi.'; }
      },
      error: () => {
        this.uploading = false;
        this.uploadProgress = 0;
        this.uploadError = 'Rasm yuklanmadi. Qayta urinib koring.';
      },
    });
  }

  submit(): void {
    if (!this.receiptUrl) { return; }
    if (!this.isSingle && !this.selectedPlanId) {
      this.submitError = 'Tarifni tanlang.';
      return;
    }
    this.submitting = true;
    this.submitError = '';

    const body: any = {
      type: this.isSingle ? 'single_content' : 'subscription',
      imageUrl: this.receiptUrl,
      amount: this.finalPrice,
      promoCode: this.appliedPromo || undefined,
      discountPercent: this.discountPercent || 0,
    };
    if (this.isSingle) {
      body.contentId = this.contentId;
      body.contentTitle = this.contentTitle;
    } else {
      const p = this.selectedPlan;
      body.planId = this.selectedPlanId;
      body.planName = (p && (p.name || p.title)) || undefined;
    }

    this.http.post<any>(this.base + '/payments/receipts', body).subscribe({
      next: () => {
        this.submitting = false;
        this.successMsg = 'Chekingiz admin tekshiruviga yuborildi.';
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Yuborilmadi. Internetni tekshirib qayta urinib koring.';
      },
    });
  }

  back(): void {
    this.router.navigate(['/']);
  }
}
