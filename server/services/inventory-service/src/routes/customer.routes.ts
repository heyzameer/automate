import { Router } from 'express';
import { WishlistController } from '../controllers/WishlistController';
import { BookingController } from '../controllers/BookingController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();
const wishlistController = new WishlistController();
const bookingController = new BookingController();

// All customer routes require authentication and CUSTOMER role
router.use(authenticate);
router.use(authorize(UserRole.CUSTOMER));

// Wishlist
router.post('/wishlist', (req, res) => wishlistController.addToWishlist(req, res));
router.get('/wishlist', (req, res) => wishlistController.getWishlist(req, res));
router.delete('/wishlist/:vehicleId', (req, res) => wishlistController.removeFromWishlist(req, res));

// Bookings
router.post('/bookings', (req, res) => bookingController.createBooking(req, res));
router.get('/bookings', (req, res) => bookingController.getMyBookings(req, res));

export default router;
