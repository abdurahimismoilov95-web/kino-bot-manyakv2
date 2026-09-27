import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReceiptStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ReceiptType {
  SUBSCRIPTION  = 'subscription',
  SINGLE_CONTENT = 'single_content',
}

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar' })
  @Index()
  userId: string;

  @ManyToOne(() => User, (u) => u.receipts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ReceiptType, default: ReceiptType.SUBSCRIPTION })
  type: ReceiptType;

  @Column({ type: 'enum', enum: ReceiptStatus, default: ReceiptStatus.PENDING })
  @Index()
  status: ReceiptStatus;

  /** To'lov cheki rasmi URL (nginx orqali himoyalangan) */
  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ name: 'plan_id', type: 'varchar', nullable: true })
  planId: string | null;

  @Column({ name: 'plan_name', type: 'varchar', length: 128, nullable: true })
  planName: string | null;

  @Column({ name: 'content_id', type: 'uuid', nullable: true })
  contentId: string | null;

  @Column({ name: 'content_title', type: 'varchar', nullable: true })
  contentTitle: string | null;

  @Column({ name: 'amount', type: 'int', default: 0 })
  amount: number;

  @Column({ name: 'promo_code', type: 'varchar', length: 32, nullable: true })
  promoCode: string | null;

  @Column({ name: 'discount_percent', type: 'smallint', default: 0 })
  discountPercent: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  /** Admin kim tasdiqladi */
  @Column({ name: 'reviewed_by', type: 'varchar', nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
