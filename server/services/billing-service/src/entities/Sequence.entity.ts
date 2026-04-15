import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('sequences')
@Index(['tenantId', 'type'], { unique: true })
export class SequenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  type!: string; // 'invoice', 'delivery_note', etc.

  @Column('int', { default: 0 })
  currentNumber!: number;
}
