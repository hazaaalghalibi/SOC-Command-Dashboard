export function nextAlertId(): string {
  return `ALT-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function nextIncidentId(seq: number): string {
  return `INC-2026-${String(seq).padStart(4, "0")}`;
}
