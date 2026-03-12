"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tenantAuth = (jwtSecret) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'Authorization token required' });
            }
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            if (!decoded.tenantId && decoded.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Tenant ID missing in token' });
            }
            // Attach to request
            req.user = decoded;
            // In a real microservice, we might want to check if the tenant is still active in a cache (like Redis)
            // For now, we assume the token is valid if not expired.
            // Expiry check is handled by jwt.verify.
            next();
        }
        catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    };
};
exports.tenantAuth = tenantAuth;
