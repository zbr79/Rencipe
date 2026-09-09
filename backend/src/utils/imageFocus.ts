export type ImageFocus = {
  x: number;
  y: number;
  zoom: number;
};

export type RecipeImageFocus = {
  card: ImageFocus;
  hero: ImageFocus;
  detail: ImageFocus;
};

export const DEFAULT_IMAGE_FOCUS: ImageFocus = {
  x: 50,
  y: 50,
  zoom: 1,
};

export const DEFAULT_RECIPE_IMAGE_FOCUS: RecipeImageFocus = {
  card: DEFAULT_IMAGE_FOCUS,
  hero: DEFAULT_IMAGE_FOCUS,
  detail: DEFAULT_IMAGE_FOCUS,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function normalizeSingleImageFocus(value: unknown): ImageFocus {
  if (!value || typeof value !== "object") return { ...DEFAULT_IMAGE_FOCUS };

  const source = value as Record<string, unknown>;
  const x = Number(source.x);
  const y = Number(source.y);
  const zoom = Number(source.zoom);

  return {
    x: Number.isFinite(x) ? clamp(x, 0, 100) : DEFAULT_IMAGE_FOCUS.x,
    y: Number.isFinite(y) ? clamp(y, 0, 100) : DEFAULT_IMAGE_FOCUS.y,
    zoom: Number.isFinite(zoom) ? clamp(zoom, 1, 2.5) : DEFAULT_IMAGE_FOCUS.zoom,
  };
}

export function normalizeImageFocus(value: unknown): RecipeImageFocus {
  if (!value || typeof value !== "object") return structuredClone(DEFAULT_RECIPE_IMAGE_FOCUS);

  const source = value as Record<string, unknown>;
  const isLegacyValue = "x" in source || "y" in source || "zoom" in source;
  const fallback = isLegacyValue ? normalizeSingleImageFocus(source) : DEFAULT_IMAGE_FOCUS;

  return {
    card: "card" in source ? normalizeSingleImageFocus(source.card) : { ...fallback },
    hero: "hero" in source ? normalizeSingleImageFocus(source.hero) : { ...fallback },
    detail: "detail" in source ? normalizeSingleImageFocus(source.detail) : { ...fallback },
  };
}
