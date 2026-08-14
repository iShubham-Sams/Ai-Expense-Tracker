import express from "express";
import cors from "cors";
import { agent } from "./agent.ts";
import type { StreamMessage } from "./types.ts";

const app = express();
const port = 8080;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.get("/", (_req, _res) => {
  _res.send("Hello World!");
});

app.post("/chat", async (_req, _res) => {
  if (!_req.body?.query) {
    return _res.status(400).json({ error: "Missing required field: query" });
  }
  _res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const response = await agent.stream(
    {
      messages: [
        {
          role: "human",
          content: _req.body?.query,
        },
      ],
    },
    // generate thread_id dynamic
    { configurable: { thread_id: "1" }, streamMode: ["messages"] },
  );

  for await (const [eventType, chunk] of response) {
    const messageType = chunk[0].type;
    let message: StreamMessage | null = null;
    if (messageType == "ai") {
      message = {
        type: "ai",
        payload: {
          text: chunk[0].content as string,
        },
      };
    }
    _res.write(`event: ${eventType}\n`);
    _res.write(`data: ${JSON.stringify(message)}\n\n`);
  }
  _res.end();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
