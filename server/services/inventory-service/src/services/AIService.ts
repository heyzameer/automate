import { GoogleGenAI } from '@google/genai';
import { injectable } from 'tsyringe';
import { logger } from '../utils/logger';

@injectable()
export class AIService {
    private genAI: GoogleGenAI;
    private model: string = 'gemini-3-flash-preview';

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenAI({ apiKey });
    }

    async suggestPrice(vehicleData: any): Promise<number | null> {
        try {
            const prompt = `
                You are a professional used car valuation expert in India. 
                Based on the following vehicle details, suggest a competitive market price in INR (integer). 
                Details:
                Brand: ${vehicleData.brand}
                Model: ${vehicleData.model}
                Year: ${vehicleData.year}
                KMs Driven: ${vehicleData.km_driven}
                Fuel: ${vehicleData.fuel}
                Transmission: ${vehicleData.transmission}
                Owner: ${vehicleData.ownership}
                
                Respond with ONLY the number.
            `;

            const result = await this.genAI.models.generateContent({
                model: this.model,
                contents: prompt,
            });

            const text = result.text?.trim() || '';
            const price = parseInt(text.replace(/[^0-9]/g, ''));
            
            return isNaN(price) ? null : price;
        } catch (error: any) {
            logger.error('Error in AI price suggestion:', error.message);
            return null;
        }
    }
}
