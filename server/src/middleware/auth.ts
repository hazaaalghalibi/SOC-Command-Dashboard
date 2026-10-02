import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/authService.js";
import type { SocRole } from "../constants/roles.js";

const SKIP = process.env.SOC_SKIP_AUTH === "true";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (SKIP) {
    req.user = {
      id: "skip-auth-user",
      email: "skip@soc.local",
      name: "SOC (auth skipped)",
      role: "admin",
    };
    return next();
  }

  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) {
    req.user = undefined;
    return next();
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = payload;
  return next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (SKIP) return next();
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  return next();
}

export function requireRoles(...roles: SocRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (SKIP) return next();
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}

/** Analyst or admin (mutations) */
export const requireAnalyst = requireRoles("admin", "analyst");

/** Admin-only */
export const requireAdmin = requireRoles("admin");
