export function getScheduledPlanDisplayName(name?: string) {
  const trimmed = name?.trim() || "Untitled Plan";
  return trimmed
    .replace(/weekly plan/gi, "Scheduled Plan")
    .replace(/meal plan/gi, "Plan")
    .replace(/weekly/gi, "Scheduled");
}