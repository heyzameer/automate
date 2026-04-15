import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { logger } from '../utils/logger';
import config from '../config';
import { HttpStatus } from '@carbot/common';

import { BotService } from '../services/BotService';

@injectable()
export class WebhookController {
    constructor(private botService: BotService) {}

    /**
     * Verification for Meta's WhatsApp Cloud API (GET)
     */
    async verifyWebhook(req: Request, res: Response) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
                logger.info('Webhook verified');
                return res.status(HttpStatus.OK).send(challenge);
            } else {
                logger.warn('Webhook verification failed: token mismatch');
                return res.sendStatus(HttpStatus.FORBIDDEN);
            }
        }
        res.sendStatus(HttpStatus.BAD_REQUEST);
    }

    /**
     * Handling incoming messages (POST)
     */
    async handleWebhook(req: Request, res: Response) {
        // WhatsApp always expects a 200 OK fast
        res.sendStatus(200);

        try {
            const body = req.body;
            if (body.object) {
                if (
                    body.entry &&
                    body.entry[0].changes &&
                    body.entry[0].changes[0].value.messages &&
                    body.entry[0].changes[0].value.messages[0]
                ) {
                    const value = body.entry[0].changes[0].value;
                    const phoneNumberId = value.metadata.phone_number_id;
                    const from = value.messages[0].from;
                    const messageId = value.messages[0].id;
                    const timestamp = value.messages[0].timestamp;
                    
                    let messageBody = '';
                    if (value.messages[0].type === 'text') {
                        messageBody = value.messages[0].text.body;
                    } else if (value.messages[0].type === 'interactive') {
                        messageBody = value.messages[0].interactive.button_reply?.id || 
                                     value.messages[0].interactive.list_reply?.id;
                    }

                    logger.info(`Incoming message from ${from}: ${messageBody} (via: ${phoneNumberId})`);
                    
                    // Route to bot service
                    await this.botService.handleIncomingMessage(phoneNumberId, from, messageBody);
                }
            }
        } catch (error) {
            logger.error('Error handling WhatsApp webhook:', error instanceof Error ? error.message : String(error));
            if ((error as any).response?.data) {
                logger.error('WhatsApp webhook API data:', JSON.stringify((error as any).response.data));
            }
        }
    }
}
