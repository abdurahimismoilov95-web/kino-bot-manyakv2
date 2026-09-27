import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-content',
  template: `
    <div class="px-4 pt-4">

      <!-- Add / Edit Form -->
      <div class="section-card mb-4" *ngIf="showForm">
        <h3 class="section-title">{{ editing ? '&#9998; Tahrirlash' : '&#43; Yangi kontent qo\'shish' }}</h3>
        <form [formGroup]="form" (ngSubmit)="save()">
          <input class="admin-input mb-2" formControlName="title" placeholder="Sarlavha *" />
          <input class="admin-input mb-2" formControlName="originalTitle" placeholder="Asl sarlavha" />
          <select class="admin-input mb-2" formControlName="type">
            <option value="movie">Film</option>
            <option value="series">Serial</option>
            <option value="anime_series">Anime</option>
            <option value="short_drama">Short drama</option>
          </select>
          <input class="admin-input mb-2" formControlName="year" placeholder="Yil" type="number" />
          <input class="admin-input mb-2" formControlName="duration" placeholder="Davomiyligi (masalan: 1s 45d)" />
          <textarea class="admin-input mb-2" formControlName="description" placeholder="Tavsif" rows="3"></textarea>
          <input class="admin-input mb-2" formControlName="genres" placeholder="Janrlar (vergul bilan: Drama,Komediya)" />

          <!-- Poster upload -->
          <div class="upload-area mb-2">
            <label class="text-xs text-gray-400">Poster rasmi:</label>
            <input type="file" accept="image/*" class="mt-1" (change)="onPosterChange($event)" />
            <p *ngIf="posterUrl" class="text-xs text-green-400 mt-1">&#10003; Yuklandi</p>
          </div>

          <div class="flex items-center gap-4 mb-3">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" formControlName="isPremium" /> VIP kontenti
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" formControlName="isTrending" /> Trending
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" formControlName="isFeatured" /> Featured
            </label>
          </div>

          <div class="flex gap-2">
            <button type="submit" class="btn-primary flex-1" [disabled]="form.invalid || saving">
              {{ saving ? 'Saqlanmoqda...' : (editing ? 'Saqlash' : 'Qo\'shish') }}
            </button>
            <button type="button" class="btn-secondary" (click)="cancelForm()">Bekor</button>
          </div>
        </form>
      </div>

      <!-- Toolbar -->
      <div class="flex justify-between items-center mb-3">
        <input class="admin-input" style="max-width:200px" type="text" placeholder="Qidirish..."
               [(ngModel)]="query" (input)="onSearch()" />
        <button class="btn-primary text-sm" (click)="openAddForm()">+ Qo'shish</button>
      </div>

      <!-- Table -->
      <div *ngIf="loading" class="text-center py-6 text-gray-400">Yuklanmoqda...</div>

      <div *ngFor="let c of items" class="content-row-card">
        <img [src]="c.posterUrl || 'assets/no-poster.png'" class="w-12 h-16 object-cover rounded-lg" />
        <div class="flex-1 ml-3 min-w-0">
          <p class="font-semibold text-sm truncate">{{ c.title }}</p>
          <div class="flex gap-2 mt-0.5 flex-wrap">
            <span class="badge-xs">{{ c.type }}</span>
            <span *ngIf="c.isPremium" class="badge-xs vip">VIP</span>
            <span *ngIf="c.isTrending" class="badge-xs trend">&#128293;</span>
            <span class="badge-xs" [class.ready]="c.transcodeStatus==='ready'" [class.pending]="c.transcodeStatus==='pending'">
              HLS: {{ c.transcodeStatus }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-1">&#128065; {{ c.viewsCount }}</p>
        </div>
        <div class="flex flex-col gap-1 ml-2">
          <button class="btn-xs neutral" (click)="edit(c)">&#9998;</button>
          <button class="btn-xs danger" (click)="delete(c)">&#128465;</button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-between mt-4" *ngIf="totalPages > 1">
        <button class="btn-xs neutral" [disabled]="page <= 1" (click)="prevPage()">&#8592;</button>
        <span class="text-sm text-gray-400">{{ page }} / {{ totalPages }}</span>
        <button class="btn-xs neutral" [disabled]="page >= totalPages" (click)="nextPage()">&#8594;</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-input { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #fff; font-size: 0.875rem; outline: none; box-sizing: border-box; }
    .section-card { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.08); }
    .section-title { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 12px; }
    .content-row-card { display: flex; align-items: center; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); }
    .badge-xs { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
    .badge-xs.vip { background: rgba(255,215,0,0.2); color: #ffd700; }
    .badge-xs.trend { background: rgba(239,68,68,0.15); color: #f87171; }
    .badge-xs.ready { background: rgba(34,197,94,0.2); color: #22c55e; }
    .badge-xs.pending { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .btn-xs { padding: 5px 10px; border-radius: 8px; border: none; font-size: 0.75rem; cursor: pointer; }
    .neutral { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
    .danger  { background: rgba(239,68,68,0.2); color: #ef4444; }
    .upload-area { border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 10px; }
  `]
})
export class AdminContentComponent implements OnInit {
  items: any[] = [];
  loading = false;
  showForm = false;
  editing: any = null;
  saving = false;
  query = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  posterUrl = '';
  posterFile: File | null = null;
  form!: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit() { this.load(); }

  initForm(data: any = {}) {
    this.form = this.fb.group({
      title:         [data.title || '', Validators.required],
      originalTitle: [data.originalTitle || ''],
      type:          [data.type || 'movie'],
      year:          [data.year || ''],
      duration:      [data.duration || ''],
      description:   [data.description || ''],
      genres:        [Array.isArray(data.genres) ? data.genres.join(',') : (data.genres || '')],
      isPremium:     [data.isPremium || false],
      isTrending:    [data.isTrending || false],
      isFeatured:    [data.isFeatured || false],
    });
  }

  load() {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit };
    if (this.query.trim()) params.search = this.query.trim();
    this.api.getContent(params).subscribe({
      next: (r: any) => { this.items = r.data; this.totalPages = r.totalPages; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  onSearch() { this.page = 1; this.load(); }

  openAddForm() { this.editing = null; this.initForm(); this.posterUrl = ''; this.showForm = true; }

  edit(item: any) { this.editing = item; this.initForm(item); this.posterUrl = item.posterUrl || ''; this.showForm = true; }

  cancelForm() { this.showForm = false; this.editing = null; }

  onPosterChange(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    this.posterFile = file;
    this.api.uploadPoster(file).subscribe({
      next: (r: any) => { this.posterUrl = r.url; this.form.patchValue({ posterUrl: r.url }); },
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const raw = this.form.value;
    const data: any = {
      ...raw,
      genres: raw.genres ? raw.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
    };
    if (this.posterUrl) data.posterUrl = this.posterUrl;

    const req = this.editing
      ? this.api.updateContent(this.editing.id, data)
      : this.api.createContent(data);

    req.subscribe({
      next: (saved: any) => {
        this.saving = false;
        this.showForm = false;
        if (this.editing) {
          const idx = this.items.findIndex((i) => i.id === saved.id);
          if (idx >= 0) this.items[idx] = saved;
        } else {
          this.items.unshift(saved);
        }
      },
      error: () => (this.saving = false),
    });
  }

  delete(item: any) {
    if (!confirm(`"${item.title}" o'chirilsinmi?`)) return;
    this.api.deleteContent(item.id).subscribe({
      next: () => { this.items = this.items.filter((i) => i.id !== item.id); },
    });
  }

  prevPage() { if (this.page > 1) { this.page--; this.load(); } }
  nextPage() { if (this.page < this.totalPages) { this.page++; this.load(); } }
}
