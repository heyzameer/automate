/**
 * Low-level Joi custom validator helpers.
 * Used by validators/common.ts to build reusable Joi schemas.
 *
 * Do NOT import this file directly in features — use the Joi schemas
 * from `../validators/common` instead (e.g. emailSchema, phoneSchema).
 */

export const validateObjectId = (value: string, helpers: any) => {
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

export const validateEmail = (value: string, helpers: any) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

export const validatePhone = (value: string, helpers: any) => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};
