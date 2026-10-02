import type { Request, Response } from "express";
import {
  listNotificationsForUser,
  markAllRead,
  markNotificationRead,
  unreadCount,
} from "../services/notificationService.js";

export async function notificationsGet(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [items, unread] = await Promise.all([
      listNotificationsForUser(req.user.id),
      unreadCount(req.user.id),
    ]);
    res.json({ items, unread });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function notificationReadPatch(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const row = await markNotificationRead(req.params.id!, req.user.id);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

export async function notificationsReadAllPost(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    await markAllRead(req.user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
