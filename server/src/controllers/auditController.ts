import type { Request, Response } from "express";
import { listAudit } from "../services/auditService.js";

export async function auditGet(_req: Request, res: Response) {
  try {
    const rows = await listAudit(150);
    res.json(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        details: r.details,
        actor: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : null,
      })),
    );
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
