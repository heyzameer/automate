import { IExpense } from '../../models/Expense.model';
import { IMongoBaseRepository } from '../../repositories/MongoBaseRepository';

export interface IExpenseRepository extends IMongoBaseRepository<IExpense> {
    findByTenant(tenantId: string): Promise<IExpense[]>;
}
