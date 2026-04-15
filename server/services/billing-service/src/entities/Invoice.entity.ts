import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column()
  invoiceNumber!: string;

  @Column()
  vehicleId!: string;

  @Column()
  customerId!: string;

  @Column()
  customerName!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  taxAmount!: number;

  @Column('jsonb')
  taxDetails!: {
    cgst: number;
    sgst: number;
    igst: number;
  };

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT
  })
  status!: InvoiceStatus;

  @Column('jsonb')
  items!: Array<{
    description: string;
    amount: number;
  }>;

  @Column({ nullable: true })
  pdfUrl!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
