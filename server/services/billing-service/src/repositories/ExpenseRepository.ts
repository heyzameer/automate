import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Expense, IExpense } from '../models/Expense';

@injectable()
export class ExpenseRepository extends BaseRepository<IExpense> {
  constructor() {
    super(Expense);
  }

  async findByTenant(tenantId: string): Promise<IExpense[]> {
    return this.find({ tenantId });
  }
}
