import { container } from 'tsyringe';
import { LeadRepository } from './repositories/LeadRepository';
import { VehicleRepository } from './repositories/VehicleRepository';
import { TenantRepository } from './repositories/TenantRepository';
import { SessionRepository } from './repositories/SessionRepository';
import { LeadService } from './services/LeadService';
import { WhatsAppService } from './services/WhatsAppService';
import { GeminiService } from './services/GeminiService';
import { BotService } from './services/BotService';

// Repositories
container.register('LeadRepository', { useClass: LeadRepository });
container.register('VehicleRepository', { useClass: VehicleRepository });
container.register('TenantRepository', { useClass: TenantRepository });
container.register('SessionRepository', { useClass: SessionRepository });

// Services
container.register(LeadService, { useClass: LeadService });
container.register(WhatsAppService, { useClass: WhatsAppService });
container.register(GeminiService, { useClass: GeminiService });
container.register(BotService, { useClass: BotService });

export { container };
