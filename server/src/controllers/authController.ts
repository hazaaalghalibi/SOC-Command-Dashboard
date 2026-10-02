import type { Request, Response } from "express";
import { asyncRoute } from "../middleware/asyncRoute.js";
import { authenticateUser, signToken } from "../services/authService.js";
import { appendAudit } from "../services/auditService.js";

async function handleAuthLogin(req: Request, res: Response): Promise<void> {
  const email = typeof req.body?.email === "string" ? req.body.email : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    res.status(400).json({ error: "email and password required" });
    return;
  }
  const user = await authenticateUser(email, password);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  await appendAudit(user.id, "auth.login", "auth", user.id, undefined).catch(() => undefined);
  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

export const authLoginPost = asyncRoute(handleAuthLogin);

export function authMeGet(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
}
