import type { CSSProperties } from "react";

export interface ImageFocus {
  x: number;
  y: number;
  zoom: number;
}

export interface RecipeImageFocus {
  card: ImageFocus;
  hero: ImageFocus;
  detail: ImageFocus;
}

export type ImageFocusSurface = keyof RecipeImageFocus;

export const DEFAULT_IMAGE_FOCUS: ImageFocus = {
  x: 50,
  y: 50,
  zoom: 1,
};

export const DEFAULT_RECIPE_IMAGE_FOCUS: RecipeImageFocus = {
  card: { ...DEFAULT_IMAGE_FOCUS },
  hero: { ...DEFAULT_IMAGE_FOCUS },
  detail: { ...DEFAULT_IMAGE_FOCUS },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function normalizeSingleImageFocus(value?: Partial<ImageFocus> | null): ImageFocus {
  const x = Number(value?.x);
  const y = Number(value?.y);
  const zoom = Number(value?.zoom);

  return {
    x: Number.isFinite(x) ? clamp(x, 0, 100) : DEFAULT_IMAGE_FOCUS.x,
    y: Number.isFinite(y) ? clamp(y, 0, 100) : DEFAULT_IMAGE_FOCUS.y,
    zoom: Number.isFinite(zoom) ? clamp(zoom, 1, 2.5) : DEFAULT_IMAGE_FOCUS.zoom,
  };
}

export function normalizeImageFocus(value?: Partial<RecipeImageFocus> | Partial<ImageFocus> | null): RecipeImageFocus {
  if (!value) return DEFAULT_RECIPE_IMAGE_FOCUS;

  const source = value as Record<string, unknown>;
  const isLegacyValue = "x" in source || "y" in source || "zoom" in source;
  const fallback = isLegacyValue ? normalizeSingleImageFocus(source as Partial<ImageFocus>) : DEFAULT_IMAGE_FOCUS;

  return {
    card: "card" in source ? normalizeSingleImageFocus(source.card as Partial<ImageFocus>) : { ...fallback },
    hero: "hero" in source ? normalizeSingleImageFocus(source.hero as Partial<ImageFocus>) : { ...fallback },
    detail: "detail" in source ? normalizeSingleImageFocus(source.detail as Partial<ImageFocus>) : { ...fallback },
  };
}

export function getImageFocusStyle(focus?: Partial<ImageFocus> | null): CSSProperties {
  const normalized = normalizeSingleImageFocus(focus);

  return {
    objectPosition: `${normalized.x}% ${normalized.y}%`,
    transform: `scale(${normalized.zoom})`,
    transformOrigin: `${normalized.x}% ${normalized.y}%`,
  };
}
