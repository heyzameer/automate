import { container } from 'tsyringe';
import { CampaignRepository } from './repositories/CampaignRepository';
import { CampaignService } from './services/CampaignService';
import { FestivalService } from './services/FestivalService';

// Repositories
container.register('CampaignRepository', { useClass: CampaignRepository });

// Services
container.register(CampaignService, { useClass: CampaignService });
container.register(FestivalService, { useClass: FestivalService });

export { container };
