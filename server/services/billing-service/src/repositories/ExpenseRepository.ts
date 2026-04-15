import { injectable } from 'tsyringe';
import { MongoBaseRepository } from './MongoBaseRepository';
import { ExpenseModel, IExpense } from '../models/Expense.model';
import { IExpenseRepository } from '../interfaces/IRepository/IExpenseRepository';

@injectable()
export class ExpenseRepository extends MongoBaseRepository<IExpense> implements IExpenseRepository {
    constructor() {
        super(ExpenseModel);
    }

    async findByTenant(tenantId: string): Promise<IExpense[]> {
        return this.find({ tenantId });
    }
}
