import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-subscription',
  template: `
    <div class="sb">
      <div class="sb-top">
        <button class="sb-back" (click)="back()">&#8592;</button>
        <span class="sb-name">Obuna va tolov</span>
      </div>

      <div class="sb-pad">
        <h1 class="sb-h1">VIP obuna</h1>
        <p class="sb-lead">Barcha premium kinolar, seriallar va anime cheksiz.</p>

        <div class="sb-plans">
          <button
            class="sb-plan"
            *ngFor="let p of plans"
            [class.sb-plan-on]="selectedPlanId === p.id"
            (click)="selectPlan(p)">
            <div class="sb-plan-l">
              <p class="sb-plan-name">{{ p.name }}</p>
              <p class="sb-plan-days">{{ p.durationDays }} kun</p>
            </div>
            <div class="sb-plan-r">
              <p class="sb-plan-price">{{ money(p.price) }}</p>
              <p class="sb-plan-cur">som</p>
            </div>
          </button>
          <p class="sb-empty" *ngIf="!loadingPlans && !plans.length">Tariflar topilmadi.</p>
          <p class="sb-empty" *ngIf="loadingPlans">Yuklanmoqda...</p>
        </div>

        <div class="sb-box">
          <p class="sb-label">Promokod</p>
          <div class="sb-promo">
            <input class="sb-input" [(ngModel)]="promoInput" [ngModelOptions]="{ standalone: true }"
                   placeholder="Masalan: MANYAK20" />
            <button class="sb-promo-btn" [disabled]="checkingPromo" (click)="applyPromo()">
              {{ checkingPromo ? '...' : 'Tekshirish' }}
            </button>
          </div>
          <p class="sb-promo-msg" [class.sb-err]="promoError" *ngIf="promoMessage">{{ promoMessage }}</p>
        </div>

        <div class="sb-total">
          <span>Tolov summasi</span>
          <strong>{{ money(finalPrice) }} som</strong>
        </div>

        <div class="sb-box">
          <p class="sb-label">Karta raqami</p>
          <div class="sb-card">
            <span class="sb-card-num">{{ cardNumber }}</span>
            <button class="sb-copy" (click)="copy(cardNumber)">Nusxa</button>
          </div>
          <p class="sb-card-owner">{{ cardOwner }}</p>
          <p class="sb-hint">
            Yuqoridagi kartaga tolov qiling, sungra chek rasmini yuklang.
            Admin tasdiqlagach obuna avtomatik faollashadi.
          </p>
        </div>

        <div class="sb-box">
          <p class="sb-label">Chek rasmi</p>
          <input type="file" accept="image/*" (change)="onFile($event)" />
          <p class="sb-hint" *ngIf="uploading">Yuklanmoqda...</p>
          <p class="sb-hint sb-ok" *ngIf="receiptUrl">Chek yuklandi.</p>
          <p class="sb-hint sb-err" *ngIf="uploadError">{{ uploadError }}</p>
          <img class="sb-preview" *ngIf="previewUrl" [src]="previewUrl" alt="chek" />
        </div>

        <div class="sb-box">
          <p class="sb-label">Izoh (ixtiyoriy)</p>
          <textarea class="sb-input sb-area" rows="3"
                    [(ngModel)]="notes" [ngModelOptions]="{ standalone: true }"
                    placeholder="Tolov haqida qoshimcha malumot"></textarea>
        </div>

        <button class="sb-submit" [disabled]="submitting || !receiptUrl || !selectedPlanId"
                (click)="submit()">
          {{ submitting ? 'Yuborilmoqda...' : 'Chekni yuborish' }}
        </button>
        <p class="sb-hint sb-err" *ngIf="submitError">{{ submitError }}</p>
        <p class="sb-done" *ngIf="submitted">
          Chek qabul qilindi. Admin tasdiqlashini kuting.
        </p>

        <section class="sb-hist" *ngIf="receipts.length">
          <h2 class="sb-h2">Mening cheklarim</h2>
          <div class="sb-rc" *ngFor="let r of receipts">
            <span>{{ money(r.amount) }} som</span>
            <span class="sb-st" [class.sb-st-ok]="r.status === 'approved'"
                  [class.sb-st-no]="r.status === 'rejected'">{{ statusLabel(r.status) }}</span>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .sb { background: #0f0f0f; min-height: 100dvh; padding-bottom: 96px; }
    .sb-top {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      position: sticky; top: 0; z-index: 30;
      background: rgba(15,15,15,0.95); backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(39,39,42,0.8);
    }
    .sb-back {
      width: 32px; height: 32px; border-radius: 999px;
      background: rgba(39,39,42,0.9); color: #fff;
      border: 1px solid rgba(63,63,70,0.7); font-size: 16px;
    }
    .sb-name { font-size: 14px; font-weight: 700; color: #fff; }
    .sb-pad { padding: 16px 14px 0; }
    .sb-h1 { margin: 0; font-size: 22px; font-weight: 900; color: #fff; }
    .sb-lead { margin: 6px 0 0; font-size: 13px; color: #a1a1aa; }
    .sb-plans { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .sb-plan {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px; border-radius: 14px; text-align: left;
      background: rgba(24,24,27,0.9); border: 1px solid rgba(39,39,42,0.9);
    }
    .sb-plan-on { border-color: #dc2626; background: rgba(69,10,10,0.35); }
    .sb-plan-name { margin: 0; font-size: 14px; font-weight: 800; color: #fff; }
    .sb-plan-days { margin: 2px 0 0; font-size: 11px; color: #a1a1aa; }
    .sb-plan-r { text-align: right; }
    .sb-plan-price { margin: 0; font-size: 16px; font-weight: 900; color: #f87171; }
    .sb-plan-cur { margin: 0; font-size: 10px; color: #71717a; }
    .sb-empty { font-size: 12px; color: #71717a; }
    .sb-box {
      margin-top: 16px; padding: 14px; border-radius: 14px;
      background: rgba(24,24,27,0.85); border: 1px solid rgba(39,39,42,0.9);
    }
    .sb-label { margin: 0 0 8px; font-size: 12px; font-weight: 800; color: #d4d4d8; }
    .sb-promo { display: flex; gap: 8px; }
    .sb-input {
      flex: 1; width: 100%; padding: 10px 12px; border-radius: 10px;
      background: #0f0f0f; color: #fff; font-size: 13px;
      border: 1px solid rgba(63,63,70,0.8); outline: none;
    }
    .sb-area { resize: vertical; font-family: inherit; }
    .sb-promo-btn {
      padding: 10px 14px; border-radius: 10px; border: none;
      background: #3f3f46; color: #fff; font-size: 12px; font-weight: 700;
    }
    .sb-promo-msg { margin: 8px 0 0; font-size: 12px; color: #34d399; }
    .sb-err { color: #f87171 !important; }
    .sb-ok { color: #34d399 !important; }
    .sb-total {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 16px; padding: 14px; border-radius: 14px;
      background: linear-gradient(to right, rgba(69,10,10,0.6), rgba(24,24,27,0.9));
      border: 1px solid rgba(153,27,27,0.5);
      color: #d4d4d8; font-size: 13px;
    }
    .sb-total strong { color: #fff; font-size: 17px; }
    .sb-card {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 12px; border-radius: 10px; background: #0f0f0f;
      border: 1px solid rgba(63,63,70,0.8);
    }
    .sb-card-num { color: #fff; font-size: 15px; font-weight: 800; letter-spacing: 0.06em; }
    .sb-copy {
      padding: 6px 12px; border-radius: 8px; border: none;
      background: #dc2626; color: #fff; font-size: 11px; font-weight: 800;
    }
    .sb-card-owner { margin: 8px 0 0; font-size: 12px; color: #a1a1aa; }
    .sb-hint { margin: 8px 0 0; font-size: 11px; line-height: 1.5; color: #71717a; }
    .sb-preview {
      margin-top: 10px; width: 100%; max-height: 220px; object-fit: contain;
      border-radius: 10px; border: 1px solid rgba(63,63,70,0.7);
    }
    .sb-submit {
      width: 100%; margin-top: 18px; padding: 14px; border-radius: 12px; border: none;
      background: #dc2626; color: #fff; font-size: 14px; font-weight: 900;
    }
    .sb-submit:disabled { background: #3f3f46; color: #a1a1aa; }
    .sb-done { margin-top: 12px; font-size: 13px; color: #34d399; text-align: center; }
    .sb-hist { margin-top: 24px; }
    .sb-h2 { font-size: 15px; font-weight: 900; color: #fff; margin: 0 0 10px; }
    .sb-rc {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 12px; border-radius: 10px; margin-bottom: 8px;
      background: rgba(24,24,27,0.9); border: 1px solid rgba(39,39,42,0.9);
      color: #e4e4e7; font-size: 13px;
    }
    .sb-st { font-size: 11px; font-weight: 800; color: #fbbf24; }
    .sb-st-ok { color: #34d399; }
    .sb-st-no { color: #f87171; }
  `],
})
export class SubscriptionComponent implements OnInit {
  plans: any[] = [];
  receipts: any[] = [];
  loadingPlans = true;

  selectedPlanId = '';
  basePrice = 0;
  discountPercent = 0;
  appliedPromo = '';

  promoInput = '';
  promoMessage = '';
  promoError = false;
  checkingPromo = false;

  receiptUrl = '';
  previewUrl = '';
  uploading = false;
  uploadError = '';

  notes = '';
  submitting = false;
  submitted = false;
  submitError = '';

  cardNumber = '8600 0000 0000 0000';
  cardOwner = 'MANYAK TV';

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.api.getPlans().subscribe({
      next: (r: any) => {
        this.plans = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        this.loadingPlans = false;
        if (this.plans.length) { this.selectPlan(this.plans[0]); }
      },
      error: () => { this.loadingPlans = false; },
    });

    this.api.getMyReceipts().subscribe({
      next: (r: any) => { this.receipts = Array.isArray(r) ? r : (r && r.data ? r.data : []); },
      error: () => { /* noop */ },
    });
  }

  get finalPrice(): number {
    const p = this.basePrice || 0;
    if (!this.discountPercent) { return p; }
    return Math.round(p * (100 - this.discountPercent) / 100);
  }

  selectPlan(p: any): void {
    if (!p) { return; }
    this.selectedPlanId = p.id;
    this.basePrice = p.price || 0;
  }

  money(v: any): string {
    const n = Number(v || 0);
    return n.toLocaleString('ru-RU');
  }

  statusLabel(s: string): string {
    if (s === 'approved') { return 'Tasdiqlangan'; }
    if (s === 'rejected') { return 'Rad etilgan'; }
    return 'Kutilmoqda';
  }

  applyPromo(): void {
    const code = (this.promoInput || '').trim();
    if (!code) { return; }
    this.checkingPromo = true;
    this.promoMessage = '';
    this.api.validatePromo(code, this.selectedPlanId).subscribe({
      next: (r: any) => {
        this.checkingPromo = false;
        const pct = r && (r.discountPercent || r.discount);
        if (pct) {
          this.discountPercent = pct;
          this.appliedPromo = code;
          this.promoError = false;
          this.promoMessage = 'Promokod qollandi: -' + pct + '%';
        } else {
          this.discountPercent = 0;
          this.promoError = true;
          this.promoMessage = 'Promokod notogri.';
        }
      },
      error: () => {
        this.checkingPromo = false;
        this.discountPercent = 0;
        this.promoError = true;
        this.promoMessage = 'Promokod topilmadi yoki muddati tugagan.';
      },
    });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) { return; }
    this.uploadError = '';

    if (file.size > 8 * 1024 * 1024) {
      this.uploadError = 'Fayl 8 MB dan katta bolmasin.';
      return;
    }

    this.previewUrl = URL.createObjectURL(file);
    this.uploading = true;
    this.api.uploadReceipt(file).subscribe({
      next: (r: any) => {
        this.uploading = false;
        this.receiptUrl = r && r.url ? r.url : '';
        if (!this.receiptUrl) { this.uploadError = 'Yuklashda xatolik.'; }
      },
      error: () => {
        this.uploading = false;
        this.uploadError = 'Chekni yuklab bolmadi. Qayta urinib koring.';
      },
    });
  }

  submit(): void {
    if (this.submitting || !this.receiptUrl || !this.selectedPlanId) { return; }
    this.submitting = true;
    this.submitError = '';
    this.api.submitReceipt({
      type: 'subscription',
      planId: this.selectedPlanId,
      amount: this.finalPrice,
      imageUrl: this.receiptUrl,
      promoCode: this.appliedPromo || undefined,
      notes: this.notes || undefined,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.receiptUrl = '';
        this.previewUrl = '';
        this.api.getMyReceipts().subscribe({
          next: (r: any) => { this.receipts = Array.isArray(r) ? r : (r && r.data ? r.data : []); },
          error: () => { /* noop */ },
        });
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Yuborib bolmadi. Qayta urinib koring.';
      },
    });
  }

  copy(text: string): void {
    const clean = (text || '').replace(/\s+/g, '');
    if (navigator.clipboard) { navigator.clipboard.writeText(clean); }
  }

  back(): void { this.router.navigate(['/']); }
}
