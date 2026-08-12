import express from "express";
import cors from "cors";

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

app.post("/chat", (_req, _res) => {
  _res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  setInterval(() => {
    _res.write("event: cgPing\n");
    _res.write(`data: Happy coding ${_req.body?.query}\n\n`);
  }, 1000);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
