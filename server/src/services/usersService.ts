import { prisma } from "../db.js";

export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: { role: { in: ["admin", "analyst"] } },
    orderBy: { name: "asc" },
    select: { id: true, email: true, name: true, role: true },
  });
}
