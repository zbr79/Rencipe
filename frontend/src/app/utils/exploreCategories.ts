export const CATEGORY_PRIORITY = [
  "Chinese",
  "Cantonese",
  "Sichuan",
  "Korean",
  "Japanese",
  "Thai",
  "Vietnamese",
];

export interface ExploreCategory {
  tag: string;
  count: number;
}

export function buildExploreCategories(recipes: { tags?: string[] }[], max = 8): ExploreCategory[] {
  const counts = new Map<string, number>();
  recipes.forEach((recipe) => {
    (recipe.tags || []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });

  const byCount = Array.from(counts.entries()).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  );
  const priority = CATEGORY_PRIORITY.map((tag) => ({
    tag,
    count: counts.get(tag) || 0,
  })).filter((entry) => entry.count > 0);
  const rest = byCount
    .filter(([tag]) => !CATEGORY_PRIORITY.includes(tag))
    .map(([tag, count]) => ({ tag, count }));

  const merged = [...priority, ...rest];
  const seen = new Set<string>();
  const result: ExploreCategory[] = [];
  for (const entry of merged) {
    if (seen.has(entry.tag)) continue;
    seen.add(entry.tag);
    result.push(entry);
    if (result.length >= max) break;
  }
  return result;
}