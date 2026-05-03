export function getScheduledPlanDisplayName(name?: string) {
  const trimmed = name?.trim() || "Untitled Meal Plan";
  return trimmed
    .replace(/weekly plan/gi, "Meal Plan")
    .replace(/weekly/gi, "Scheduled");
}