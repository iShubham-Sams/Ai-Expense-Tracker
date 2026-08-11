import { tool } from "@langchain/core/tools";
import { DatabaseSync } from "node:sqlite";
import z from "zod";

type Expense = {
  id: number;
  title: string;
  amount: number;
  date: string;
};

export function initTools(database: DatabaseSync) {
  // add expense tools
  const addExpense = tool(
    ({ title, amount }) => {
      const date = new Date().toISOString().split("T")[0];

      const stmt = database.prepare(`INSERT INTO expense (title, amount, date) VALUES (?, ?, ?)`);
      stmt.run(title, amount, date);

      return JSON.stringify({
        status: "Success",
      });
    },
    {
      name: "add_expense",
      description: "Add the given expense to database",
      schema: z.object({
        title: z.string().describe("Title of expense"),
        amount: z.number().describe("The amount spent"),
      }),
    },
  );
  //   get expenses tools
  const getExpenses = tool(
    ({ from, to }) => {
      const stmt = database.prepare(`
        SELECT id, title, amount, date
        FROM expense
        WHERE date BETWEEN ? AND ?
        ORDER BY date DESC, id DESC
      `);
      const expenses = stmt.all(from, to) as Expense[];

      return JSON.stringify({
        status: "Success",
        expenses,
      });
    },
    {
      name: "get_expenses",
      description: "get the expenses for given date range",
      schema: z.object({
        from: z.string().describe("Start date for expenses in YYYY-MM-DD format"),
        to: z.string().describe("End date for expenses in YYYY-MM-DD format"),
      }),
    },
  );

  return [addExpense, getExpenses];
}
