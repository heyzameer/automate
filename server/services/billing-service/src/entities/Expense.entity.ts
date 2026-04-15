import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ExpenseCategory {
  RENT = 'rent',
  SALARIES = 'salaries',
  UTILITY = 'utility',
  ADVERTISING = 'advertising',
  REPAIR = 'repair',
  TRANSPORT = 'transport',
  OTHER = 'other'
}

@Entity('expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory
  })
  category!: ExpenseCategory;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  @Index()
  vehicleId!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
