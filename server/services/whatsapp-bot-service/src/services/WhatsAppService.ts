import axios from 'axios';
import { injectable } from 'tsyringe';
import config from '../config';
import { logger } from '../utils/logger';

@injectable()
export class WhatsAppService {
    constructor() {}

    async sendTextMessage(to: string, message: string, phoneNumberId: string, accessToken: string) {
        try {
            const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${phoneNumberId}/messages`;
            await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: message }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error: any) {
            logger.error('Error sending WhatsApp message:', error.response?.data || error.message);
        }
    }

    async sendInteractiveList(to: string, body: string, sections: any[], phoneNumberId: string, accessToken: string) {
        try {
            const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${phoneNumberId}/messages`;
            await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        body: { text: body },
                        action: {
                            button: 'View Options',
                            sections
                        }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error: any) {
            logger.error('Error sending WhatsApp interactive list:', error.response?.data || error.message);
        }
    }

    async sendInteractiveButtons(to: string, body: string, buttons: any[], phoneNumberId: string, accessToken: string) {
        try {
            const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${phoneNumberId}/messages`;
            await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: { text: body },
                        action: {
                            buttons: buttons.map(b => ({
                                type: 'reply',
                                reply: { id: b.id, title: b.title }
                            }))
                        }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error: any) {
            logger.error('Error sending WhatsApp interactive buttons:', error.response?.data || error.message);
        }
    }

    async sendImageMessage(to: string, imageUrl: string, caption: string, phoneNumberId: string, accessToken: string) {
        try {
            const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${phoneNumberId}/messages`;
            const response = await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'image',
                    image: {
                        link: imageUrl,
                        caption
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            logger.info('✅ WhatsApp Image Sent Successfully:', { 
                id: response.data.messages?.[0]?.id,
                to 
            });
        } catch (error: any) {
            const errorData = error.response?.data;
            logger.error('❌ Error sending WhatsApp image:', {
                message: error.message,
                details: errorData || 'No response data from Meta'
            });
        }
    }

    async sendBulkText(recipients: string[], message: string, phoneNumberId: string, accessToken: string) {
        const results = { sent: 0, failed: 0 };
        for (const to of recipients) {
            try {
                await this.sendTextMessage(to, message, phoneNumberId, accessToken);
                results.sent++;
            } catch (error) {
                results.failed++;
                logger.error(`Failed to send broadcast to ${to}:`, error);
            }
        }
        return results;
    }
}
