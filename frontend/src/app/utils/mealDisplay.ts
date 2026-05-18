export function getMealDisplayName(name?: string) {
  const trimmed = name?.trim() || "Untitled Meal";
  return trimmed.replace(/meal plan/gi, "Meal");
}
