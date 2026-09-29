import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_id', type: 'varchar', length: 32, nullable: true })
  actorId: string | null;

  @Column({ name: 'actor_name', type: 'varchar', length: 160, nullable: true })
  actorName: string | null;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
