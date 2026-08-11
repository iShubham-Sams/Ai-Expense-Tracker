import { tool } from "@langchain/core/tools";
import { DatabaseSync } from "node:sqlite";
import z from "zod";

type Expense = {
  id: number;
  title: string;
  amount: number;
  date: string;
};

type ChartGroup = "month" | "week" | "date";

type ChartRow = {
  period: string;
  total: number;
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

  //   generate chart
  const generateChart = tool(
    ({ from, groupBy, to }) => {
      const periodExpressions: Record<ChartGroup, string> = {
        month: "strftime('%Y-%m', date)",
        week: "strftime('%Y-W%W', date)",
        date: "date(date)",
      };
      const periodExpression = periodExpressions[groupBy];
      const query = `
        SELECT ${periodExpression} AS period, SUM(amount) AS total
        FROM expense
        WHERE date BETWEEN ? AND ?
        GROUP BY ${periodExpression}
        ORDER BY period ASC
      `;

      const stmt = database.prepare(query);
      const data = stmt.all(from, to) as ChartRow[];
      console.log(JSON.stringify(data), "data");
      return JSON.stringify({
        status: "Success",
        groupBy,
        data,
      });
    },
    {
      name: "generate_chart",
      description: "Generate expense chart by querying database and grouping by month, and week or date",
      schema: z.object({
        from: z.string().describe("Start date for expenses in YYYY-MM-DD format"),
        to: z.string().describe("End date for expenses in YYYY-MM-DD format"),
        groupBy: z.enum(["month", "week", "date"]).describe("How to group the data: by month, week or date."),
      }),
    },
  );

  return [addExpense, getExpenses, generateChart];
}
