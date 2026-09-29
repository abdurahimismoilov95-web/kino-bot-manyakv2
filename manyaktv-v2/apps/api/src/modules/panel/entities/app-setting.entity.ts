import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/** Oddiy kalit-qiymat saqlash: kataloglar, bot va tolov sozlamalari. */
@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'jsonb' })
  value: any;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
