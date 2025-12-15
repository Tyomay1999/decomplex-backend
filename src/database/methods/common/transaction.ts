import type { Transaction } from "sequelize";
import { getSequelize } from "../../index";

export async function runInTransaction<T>(
  fn: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  const sequelize = getSequelize();

  return sequelize.transaction(async (transaction) => fn(transaction));
}
