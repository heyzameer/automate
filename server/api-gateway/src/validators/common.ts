import Joi from 'joi';
import { validateObjectId, validateEmail, validatePhone } from '../utils/validation';

export const objectIdSchema = Joi.string().custom(validateObjectId).required();

export const emailSchema = Joi.string().email().custom(validateEmail).required();

export const phoneSchema = Joi.string().custom(validatePhone).required();

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
});
