import { Schema } from 'mongoose';

/**
 * Mongoose plugin to automatically apply tenant isolation to queries.
 * It looks for a `tenantId` in the query's options or via a global context.
 * 
 * Usage:
 *   const schema = new Schema({ ... });
 *   schema.plugin(tenantPlugin);
 */
export const tenantPlugin = (schema: Schema) => {
    // Add tenantId field if it doesn't exist
    if (!schema.path('tenantId')) {
        schema.add({
            tenantId: {
                type: String,
                index: true,
                // Some models might be global, but usually they are scoped
            }
        });
    }

    // Middleware to automatically add tenant filter to queries
    const applyTenantFilter = function (this: any, next: (err?: any) => void) {
        const tenantId = this.getOptions()?.tenantId;
        
        if (tenantId) {
            this.where({ tenantId });
        }
        
        next();
    };

    schema.pre(['find', 'findOne', 'count', 'countDocuments', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], applyTenantFilter);
};
