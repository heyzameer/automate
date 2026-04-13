import { IExpense } from '../../models/Expense';
import { IBaseRepository } from '@carbot/common';

export interface IExpenseRepository extends IBaseRepository<IExpense> {
}
