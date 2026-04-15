import "reflect-metadata";
import { DataSource } from "typeorm";
import config from "./index";
import { InvoiceEntity } from "../entities/Invoice.entity";
import { ExpenseEntity } from "../entities/Expense.entity";
import { SequenceEntity } from "../entities/Sequence.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: config.postgres.host,
    port: config.postgres.port,
    username: config.postgres.username,
    password: config.postgres.password,
    database: config.postgres.database,
    synchronize: config.env === 'development', // Use migrations for production
    logging: config.env === 'development',
    entities: [InvoiceEntity, ExpenseEntity, SequenceEntity],
    migrations: [],
    subscribers: [],
});

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
    } catch (err) {
        console.error("Error during Data Source initialization", err);
        throw err;
    }
};
