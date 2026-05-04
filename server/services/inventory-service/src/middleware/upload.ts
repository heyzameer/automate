import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Standard Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'deb9pdn3c',
  api_key: process.env.CLOUDINARY_API_KEY || '374544522831379',
  api_secret: process.env.CLOUDINARY_API_SECRET || '_ET2YTdL3a3xAW5K9yP_51ZPGSs'
});

// Using Memory Storage so we can process with Sharp before Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Allow up to 50MB for raw upload, we will compress down to <10MB
});

export { cloudinary };
