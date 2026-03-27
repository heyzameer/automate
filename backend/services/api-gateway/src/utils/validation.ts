export const validateObjectId = (value: string, helpers: unknown) => {
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

export const validateEmail = (value: string, helpers: unknown) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return regexErrorFallback(helpers);
    }
    return value;
};

export const validatePhone = (value: string, helpers: unknown) => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value)) {
        return regexErrorFallback(helpers);
    }
    return value;
};

function regexErrorFallback(helpers: unknown) {
    if (helpers && typeof helpers.error === 'function') {
        return helpers.error('any.invalid');
    }
    return undefined;
}
