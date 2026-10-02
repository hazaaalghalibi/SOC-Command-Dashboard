import type { SocRole } from "../constants/roles.js";

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: SocRole;
}
