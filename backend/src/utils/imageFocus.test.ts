import { describe, expect, it } from "vitest";
import {
  DEFAULT_IMAGE_FOCUS,
  DEFAULT_RECIPE_IMAGE_FOCUS,
  normalizeImageFocus,
} from "./imageFocus";

describe("normalizeImageFocus", () => {
  it("creates three centered focus areas when no data exists", () => {
    expect(normalizeImageFocus(undefined)).toEqual(DEFAULT_RECIPE_IMAGE_FOCUS);
  });

  it("migrates legacy focus data to all three display areas", () => {
    const legacyFocus = { x: 22, y: 68, zoom: 1.4 };

    expect(normalizeImageFocus(legacyFocus)).toEqual({
      card: legacyFocus,
      hero: legacyFocus,
      detail: legacyFocus,
    });
  });

  it("preserves independent card, hero, and detail values", () => {
    expect(normalizeImageFocus({
      card: { x: 10, y: 20, zoom: 1.1 },
      hero: { x: 40, y: 50, zoom: 1.3 },
      detail: { x: 80, y: 70, zoom: 1.8 },
    })).toEqual({
      card: { x: 10, y: 20, zoom: 1.1 },
      hero: { x: 40, y: 50, zoom: 1.3 },
      detail: { x: 80, y: 70, zoom: 1.8 },
    });
  });

  it("clamps invalid focus values to supported bounds", () => {
    expect(normalizeImageFocus({
      card: { x: -10, y: 140, zoom: 8 },
      hero: { x: Number.NaN, y: Number.POSITIVE_INFINITY, zoom: 0 },
      detail: {},
    })).toEqual({
      card: { x: 0, y: 100, zoom: 2.5 },
      hero: DEFAULT_IMAGE_FOCUS,
      detail: DEFAULT_IMAGE_FOCUS,
    });
  });
});
