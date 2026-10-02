import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import type { AuthUserPayload } from "../types/auth.js";
import { isSocRole } from "../constants/roles.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "soc-dev-secret-change-me";
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "12h";

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: { id: string; email: string; name: string; role: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES },
  );
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      sub?: string;
      email?: string;
      name?: string;
      role?: string;
    };
    if (!decoded.sub || !decoded.email || !decoded.name || !decoded.role) return null;
    if (!isSocRole(decoded.role)) return null;
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user?.passwordHash) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  if (!isSocRole(user.role)) return null;
  return user;
}
