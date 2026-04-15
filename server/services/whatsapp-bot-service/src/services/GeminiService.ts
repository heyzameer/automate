import { GoogleGenAI } from "@google/genai";
import { injectable } from 'tsyringe';
import config from '../config';
import { logger } from '../utils/logger';
import { authServiceClient } from '../utils/apiClient';

@injectable()
export class GeminiService {
    private ai: GoogleGenAI | null = null;
    private currentKey: string | null = null;
    private lastFetch: number = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    private async getAiInstance(): Promise<GoogleGenAI> {
        const now = Date.now();
        
        // Use env key as fallback or if cache is still fresh and key hasn't changed
        if (this.ai && (now - this.lastFetch < this.CACHE_TTL)) {
            return this.ai;
        }

        try {
            // Try fetching from Super Admin Settings (Auth Service)
            const { data } = await authServiceClient.get('/internal/config');
            const remoteKey = data?.data?.geminiApiKey;
            const finalKey = remoteKey || config.gemini.apiKey; // Fallback to .env

            if (!this.ai || finalKey !== this.currentKey) {
                logger.info(`GeminiService: ${remoteKey ? 'Using Super Admin API Key' : 'Using env fallback key'}`);
                this.ai = new GoogleGenAI({ apiKey: finalKey });
                this.currentKey = finalKey;
            }
        } catch (error) {
            logger.warn('GeminiService: Failed to fetch remote config, using env fallback', error);
            if (!this.ai) {
                this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
                this.currentKey = config.gemini.apiKey;
            }
        }

        this.lastFetch = now;
        return this.ai!;
    }

    async parseCarQuery(userMessage: string) {
        try {
            const aiInstance = await this.getAiInstance();
            const prompt = `
            You are a car search assistant. Extract search parameters from the user's message.
            If the message is completely irrelevant to cars, showrooms, or test drives, set "intent" to "irrelevant".

            User message: "${userMessage}"

            Return JSON:
            {
              "brand": string | null,
              "model": string | null,
              "max_price": number | null,
              "min_price": number | null,
              "fuel_type": "Petrol"|"Diesel"|"CNG"|"Electric" | null,
              "transmission": "Manual"|"Automatic" | null,
              "year": number | null,
              "intent": "search"|"book"|"greeting"|"menu"|"irrelevant"
            }`;

            const response = await aiInstance.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });

            const text = response.text?.trim().replace(/```json|```/g, '') || '{}'; 
            return JSON.parse(text);
        } catch (error) {
            logger.error('Error parsing car query with Gemini 3:', error);
            return { intent: 'search' };
        }
    }

    async parseDateTime(userMessage: string) {
        try {
            const aiInstance = await this.getAiInstance();
            const now = new Date();
            const prompt = `
            Context: Today is ${now.toDateString()}. The current time is ${now.toLocaleTimeString()}.
            
            Task: Convert user input into a formal "Day, DD Month YYYY at HH:MM AM/PM" string.
            
            Rules:
            1. If input is "SLOT_10AM" or contains "10:00 AM", use 10:00 AM.
            2. If input is "SLOT_2PM" or contains "2:00 PM", use 02:00 PM.
            3. If input is "SLOT_4PM" or contains "4:00 PM", use 04:00 PM.
            4. If user says a day like "tomorrow" or "day after tomorrow" but NO TIME, default to 11:00 AM.
            5. Calculate relative dates exactly from today (${now.toDateString()}).
            
            User message: "${userMessage}"
            
            Return ONLY the final string (e.g., "Thursday, 16th April at 11:00 AM").`;

            const response = await aiInstance.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });

            return response.text?.trim() || userMessage;
        } catch (error) {
            logger.error('Error parsing date with Gemini 3:', error);
            return userMessage;
        }
    }
}
