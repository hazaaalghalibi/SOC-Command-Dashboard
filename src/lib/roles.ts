import type { SocRole } from "../types/soc";

export function canMutate(role?: SocRole | string | null): boolean {
  return role === "admin" || role === "analyst";
}
