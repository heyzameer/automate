import { Router } from 'express';
import { container } from 'tsyringe';
import { LeadController } from '../controllers/LeadController';

const router = Router();

router.get('/', (req, res) => container.resolve(LeadController).getLeads(req, res));
router.patch('/:id', (req, res) => container.resolve(LeadController).updateLead(req, res));
router.post('/:id/call-log', (req, res) => container.resolve(LeadController).addCallLog(req, res));
router.put('/:leadId/call-log/:logId', (req, res) => container.resolve(LeadController).updateCallLog(req, res));
router.delete('/:leadId/call-log/:logId', (req, res) => container.resolve(LeadController).deleteCallLog(req, res));
router.get('/vehicle/:vehicleId', (req, res) => container.resolve(LeadController).getLeadsByVehicle(req, res));
router.get('/qr/:carCode', (req, res) => container.resolve(LeadController).getQRCode(req, res));

export default router;
