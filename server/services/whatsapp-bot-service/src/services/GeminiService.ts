import { GoogleGenAI } from "@google/genai";
import { injectable } from 'tsyringe';
import config from '../config';
import { logger } from '../utils/logger';

@injectable()
export class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        // The new SDK uses an options object for initialization
        this.ai = new GoogleGenAI({
            apiKey: config.gemini.apiKey
        });
    }

    async parseCarQuery(userMessage: string) {
        try {
            const prompt = `
            You are a car search assistant. Extract search parameters from the user's message.
            If the message is completely irrelevant to cars, showrooms, or test drives (e.g. "aeroplane", "pizza"), set "intent" to "irrelevant" and all other fields to null.

            User message: "${userMessage}"

            Return ONLY valid JSON:
            {
              "brand": string or null,
              "model": string or null,
              "max_price": number or null,
              "min_price": number or null,
              "fuel_type": "Petrol"|"Diesel"|"CNG"|"Electric" or null,
              "transmission": "Manual"|"Automatic" or null,
              "year": number or null,
              "sort_by": "price_asc"|"price_desc"|"year_desc" or null,
              "intent": "search"|"book"|"greeting"|"sort"|"specific"|"menu"|"irrelevant"
            }`;

            // Updated to the gemini-3-flash-preview model and new API structure
            const response = await this.ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });

            const text = response.text?.trim().replace(/```json|```/g, '') || '{}'; 
            return JSON.parse(text);
        } catch (error) {
            logger.error('Error parsing car query with Gemini 3:', error);
            return null;
        }
    }
}
