import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { Episode } from './episode.entity';
import { WatchHistory } from './watch-history.entity';
import { Favorite } from './favorite.entity';

export enum ContentType {
  MOVIE       = 'movie',
  SERIES      = 'series',
  SHORT_DRAMA = 'short_drama',
  ANIME       = 'anime_series',
}

export enum VideoQuality {
  Q_480P  = '480p',
  Q_720P  = '720p',
  Q_1080P = '1080p',
  Q_4K    = '4K',
}

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ name: 'original_title', type: 'varchar', length: 255, nullable: true })
  originalTitle: string | null;

  @Column({ type: 'enum', enum: ContentType, default: ContentType.MOVIE })
  type: ContentType;

  @Column({ name: 'catalog_id', type: 'varchar', length: 64, nullable: true })
  catalogId: string | null;

  @Column({ name: 'poster_url', type: 'text', nullable: true })
  posterUrl: string | null;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl: string | null;

  /** Standalone film uchun. Serial/drama uchun episodes ishlatiladi. */
  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl: string | null;

  /**
   * HLS master playlist manzili (nginx orqali beriladi).
   * Format: /hls/{contentId}/master.m3u8
   * Bu field set bo'lsa, video_url dan ustun turadi.
   */
  @Column({ name: 'hls_path', type: 'text', nullable: true })
  hlsPath: string | null;

  /** Transcode holati: pending | processing | ready | failed */
  @Column({ name: 'transcode_status', type: 'varchar', length: 20, default: 'pending' })
  transcodeStatus: string;

  /** Mavjud sifat variantlari (nginx HLS dan kelib chiqadi) */
  @Column({ name: 'available_qualities', type: 'jsonb', default: [] })
  availableQualities: VideoQuality[];

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'smallint', nullable: true })
  year: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  duration: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'simple-array', default: '' })
  genres: string[];

  @Column({ name: 'is_premium', type: 'boolean', default: false })
  isPremium: boolean;

  @Column({ name: 'is_vip_included', type: 'boolean', default: true })
  isVipIncluded: boolean;

  @Column({ name: 'is_single_purchase', type: 'boolean', default: false })
  isSinglePurchase: boolean;

  @Column({ name: 'price', type: 'int', default: 0 })
  price: number;

  @Column({ name: 'is_trending', type: 'boolean', default: false })
  isTrending: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'views_count', type: 'bigint', default: 0 })
  viewsCount: number;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'revenue', type: 'bigint', default: 0 })
  revenue: number;

  @OneToMany(() => Episode, (e) => e.content, { cascade: true, eager: false })
  episodes: Episode[];

  @OneToMany(() => WatchHistory, (h) => h.content)
  watchHistories: WatchHistory[];

  @OneToMany(() => Favorite, (f) => f.content)
  favorites: Favorite[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
