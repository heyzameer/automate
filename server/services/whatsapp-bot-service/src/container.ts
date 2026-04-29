import { container } from 'tsyringe';
import { LeadRepository } from './repositories/LeadRepository';
import { SessionRepository } from './repositories/SessionRepository';
import { CampaignRepository } from './repositories/CampaignRepository';
import { LeadService } from './services/LeadService';
import { WhatsAppService } from './services/WhatsAppService';
import { GeminiService } from './services/GeminiService';
import { BotService } from './services/BotService';
import { CampaignService } from './services/CampaignService';
import { FestivalService } from './services/FestivalService';

// Repositories
container.register('LeadRepository', { useClass: LeadRepository });
container.register('SessionRepository', { useClass: SessionRepository });
container.register('CampaignRepository', { useClass: CampaignRepository });

// Services
container.register(LeadService, { useClass: LeadService });
container.register(WhatsAppService, { useClass: WhatsAppService });
container.register(GeminiService, { useClass: GeminiService });
container.register(BotService, { useClass: BotService });
container.register(CampaignService, { useClass: CampaignService });
container.register(FestivalService, { useClass: FestivalService });

export { container };
