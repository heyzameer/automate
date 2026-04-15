import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
// @ts-ignore
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'deb9pdn3c',
    api_key: process.env.CLOUDINARY_API_KEY || '374544522831379',
    api_secret: process.env.CLOUDINARY_API_SECRET || '_ET2YTdL3a3xAW5K9yP_51ZPGSs',
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => ({
        folder: 'carbot-payments',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
        public_id: `payment-proof-${Date.now()}-${file.originalname.split('.')[0]}`,
    }),
});

export const paymentUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
