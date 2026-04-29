import { Router } from 'express';
import { container } from 'tsyringe';
import { CampaignController } from '../controllers/CampaignController';

const router = Router();
const campaignController = container.resolve(CampaignController);

router.get('/', campaignController.getCampaigns.bind(campaignController));
router.post('/', campaignController.createCampaign.bind(campaignController));
router.patch('/:id', campaignController.updateCampaign.bind(campaignController));
router.delete('/:id', campaignController.deleteCampaign.bind(campaignController));
router.post('/:id/start', campaignController.startCampaign.bind(campaignController));
router.post('/:id/reopen', campaignController.reopenCampaign.bind(campaignController));

export default router;
