"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAuth = void 0;
const superAuth = async (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Super admin access required' });
    }
    next();
};
exports.superAuth = superAuth;
