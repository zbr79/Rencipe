export const COMPONENT_TAG = "Component";

export const HEALTH_TAG_OPTIONS = [
  "Balanced",
  "High Protein",
  "Low Carb",
  "Vegetarian",
  "Keto Friendly",
  "Light",
];

export function getVisibleTags(tags: string[] = []) {
  return tags.filter((tag) => tag !== COMPONENT_TAG);
}

export function getHealthTag(tags: string[] = []) {
  return tags.find((tag) => HEALTH_TAG_OPTIONS.includes(tag)) || "";
}

export function withHealthTag(tags: string[] = [], healthTag: string) {
  const nextTags = tags.filter((tag) => !HEALTH_TAG_OPTIONS.includes(tag));
  if (healthTag) nextTags.unshift(healthTag);
  return nextTags;
}

export function getPrimaryRecipeLabel(tags: string[] = []) {
  const healthTag = getHealthTag(tags);
  if (healthTag) return healthTag;
  return getVisibleTags(tags)[0] || "Recipe";
}

export function hasHealthTag(tags: string[] = []) {
  return tags.some((tag) => HEALTH_TAG_OPTIONS.includes(tag) || tag === "Healthy");
}
