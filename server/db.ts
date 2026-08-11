import { DatabaseSync } from "node:sqlite";

export function initDB(dbPath: string): DatabaseSync {
  const dataBase = new DatabaseSync(dbPath);

  const query = `
  CREATE TABLE IF NOT EXISTS expense(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL)`;

  dataBase.exec(query);
  return dataBase;
}
