export function matchesTextSearch(query: string, ...values: Array<string | undefined | null>) {
  const search = query.trim().toLowerCase();
  if (!search) return true;

  return values.some((value) => String(value || "").toLowerCase().includes(search));
}
