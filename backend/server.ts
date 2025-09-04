import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());

// TypeScript knows req and res types automatically!
app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express + TypeScript!" });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
