import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, Index, CreateDateColumn,
} from 'typeorm';
import { Content } from './content.entity';

@Entity('episodes')
@Index(['contentId', 'seasonNumber', 'episodeNumber'], { unique: true })
export class Episode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id', type: 'uuid' })
  @Index()
  contentId: string;

  @ManyToOne(() => Content, (c) => c.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'season_number', type: 'smallint', default: 1 })
  seasonNumber: number;

  @Column({ name: 'episode_number', type: 'smallint' })
  episodeNumber: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl: string | null;

  @Column({ name: 'hls_path', type: 'text', nullable: true })
  hlsPath: string | null;

  @Column({ name: 'transcode_status', type: 'varchar', length: 20, default: 'pending' })
  transcodeStatus: string;

  @Column({ name: 'available_qualities', type: 'jsonb', default: [] })
  availableQualities: string[];

  @Column({ type: 'varchar', length: 32, nullable: true })
  duration: string | null;

  @Column({ name: 'is_free', type: 'boolean', default: false })
  isFree: boolean;

  @Column({ name: 'views_count', type: 'bigint', default: 0 })
  viewsCount: number;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
