import type { Transaction } from "sequelize";

export interface DbOptions {
  transaction?: Transaction;
}
