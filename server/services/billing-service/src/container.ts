import { container } from 'tsyringe';
import { BillingService } from './services/BillingService';
import { AnalyticsService } from './services/AnalyticsService';
import { InvoiceRepository } from './repositories/InvoiceRepository';
import { ExpenseRepository } from './repositories/ExpenseRepository';
import { SequenceRepository } from './repositories/SequenceRepository';

// Register Repositories
container.register('InvoiceRepository', { useClass: InvoiceRepository });
container.register('ExpenseRepository', { useClass: ExpenseRepository });
container.register('SequenceRepository', { useClass: SequenceRepository });

// Register Services
container.register('BillingService', { useClass: BillingService });
container.register('AnalyticsService', { useClass: AnalyticsService });

export { container };
