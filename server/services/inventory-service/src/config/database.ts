import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import config from './index';

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private isConnected = false;

    private constructor() {}

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            const db = await mongoose.connect(config.database.uri, config.database.options);
            this.isConnected = true;
            logger.info(`Inventory Database connected: ${db.connection.host}`);

            // Initialize default form config if empty
            await this.initializeDefaultForm();

        } catch (error) {
            logger.error('Database connection error:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) return;
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('Inventory Database disconnected');
    }

    private async initializeDefaultForm() {
        const FormConfig = (await import('../models/FormConfig')).default;
        const count = await FormConfig.countDocuments();
        
        if (count === 0) {
            logger.info('Initializing default vehicle form configuration...');
            await FormConfig.create({
                version: 1,
                lastUpdatedBy: 'system',
                fields: [
                    { name: 'car_code', label: 'Car Code', type: 'text', required: true, order: 0, category: 'basic', placeholder: 'e.g. car01' },
                    { name: 'brand', label: 'Brand', type: 'select', options: ['Maruti', 'Hyundai', 'Toyota', 'Honda', 'Mahindra', 'Tata'], required: true, order: 1, category: 'basic' },
                    { name: 'model', label: 'Model', type: 'text', required: true, order: 2, category: 'basic' },
                    { name: 'variant', label: 'Variant', type: 'text', required: true, order: 3, category: 'basic' },
                    { name: 'year_of_manufacture', label: 'MFG Year', type: 'number', required: true, order: 4, category: 'technical' },
                    { name: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], required: true, order: 5, category: 'technical' },
                    { name: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'], required: true, order: 6, category: 'technical' },
                    { name: 'km', label: 'Kilometers', type: 'number', required: true, order: 7, category: 'technical' },
                    { name: 'price', label: 'Price (₹)', type: 'number', required: true, order: 8, category: 'pricing' },
                    { name: 'ownership', label: 'Owner Count', type: 'select', options: ['1st Owner', '2nd Owner', '3rd Owner', '4th+ Owner'], required: true, order: 9, category: 'pricing' },
                    { name: 'plate_number', label: 'Plate Number', type: 'text', required: true, order: 10, category: 'basic' }
                ]
            });
            logger.info('Default form configuration created successfully.');
        }
    }
}
