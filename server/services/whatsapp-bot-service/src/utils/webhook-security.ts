import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from './logger';

/**
 * Validates the HMAC-SHA256 signature from Meta to ensure the webhook 
 * payload originated from a trusted source.
 */
export const verifyMetaSignature = (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-hub-signature-256'] as string;
    const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Debug Bypass only allowed in non-production environments
    if (appSecret === 'SKIP' && isDev) {
        logger.warn('⚠️ Webhook security BYPASSED for local testing');
        return next();
    }
    
    if (!appSecret || appSecret === 'SKIP') {
        logger.error('❌ Missing or invalid WHATSAPP_APP_SECRET. Security check failed.');
        return res.status(500).json({ error: 'Server security configuration error' });
    }

    if (!signature) {
        logger.error('❌ Missing x-hub-signature-256 header');
        return res.status(401).json({ error: 'Missing signature' });
    }

    try {
        const elements = signature.split('=');
        const signatureHash = elements[1];
        
        // Use raw body for accurate HMAC calculation (JSON.stringify can alter result)
        const payload = (req as any).rawBody;

        if (!payload) {
            logger.error('❌ Signature verification failed: rawBody buffer not found. Ensure express.json() verify is active.');
            return res.status(500).json({ error: 'Internal configuration error' });
        }
        
        const expectedHash = crypto
            .createHmac('sha256', appSecret!)
            .update(payload)
            .digest('hex');

        if (signatureHash !== expectedHash) {
            logger.error('❌ Invalid webhook signature detected', {
                receivedHash: signatureHash.substring(0, 10) + '...',
                expectedHash: expectedHash.substring(0, 10) + '...',
                payloadLength: payload.length,
                usingRawBody: !!(req as any).rawBody
            });
            return res.status(403).json({ error: 'Invalid signature' });
        }

        next();
    } catch (error) {
        logger.error('❌ Error during signature verification:', error);
        return res.status(500).json({ error: 'Signature verification failed' });
    }
};
