import express from "express";
import cors from "cors";

const app = express();
const port = 8080;

app.use(express.json());
app.use(cors());
app.get("/", (_req, _res) => {
  _res.send("Hello World!");
});

app.get("/chat", (_req, _res) => {
  _res.writeHead(200, {
    "Content-type": "text/event-stream",
  });

  setInterval(() => {
    _res.write("event: cgPing\n");
    _res.write("data: Happy coding /n/n");
  }, 1000);
  _res.json({});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
