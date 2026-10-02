import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { registerRoutes } from "./routes/registerRoutes.js";

const PORT = Number(process.env.PORT) || 4000;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "5mb" }));

registerRoutes(app);

// Ensures async route failures (e.g. Prisma) always return JSON instead of an empty 500.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error("[SOC API]", err);
  if (res.headersSent) {
    next(err);
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`SOC API listening on http://127.0.0.1:${PORT}`);
});
