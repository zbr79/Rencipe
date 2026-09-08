import styles from "./styles.module.css";

type RecipeOrigin = "original" | "shared";

interface RecipeOriginSectionProps {
  recipeOrigin: RecipeOrigin;
  sharedSource: string;
  sharedSourceLink: string;
  onRecipeOriginChange: (value: RecipeOrigin) => void;
  onSharedSourceChange: (value: string) => void;
  onSharedSourceLinkChange: (value: string) => void;
}

export default function RecipeOriginSection({
  recipeOrigin,
  sharedSource,
  sharedSourceLink,
  onRecipeOriginChange,
  onSharedSourceChange,
  onSharedSourceLinkChange,
}: RecipeOriginSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.sectionHeader}>
        <h2>Original recipe</h2>
        </div>
        <div className={styles.originToggle} role="radiogroup" aria-label="Original recipe">
          <button
            type="button"
            className={`${styles.originOption} ${recipeOrigin === "original" ? styles.originOptionActive : ""}`}
            onClick={() => onRecipeOriginChange("original")}
            aria-pressed={recipeOrigin === "original"}
          >
            Yes
          </button>
          <button
            type="button"
            className={`${styles.originOption} ${recipeOrigin === "shared" ? styles.originOptionActive : ""}`}
            onClick={() => onRecipeOriginChange("shared")}
            aria-pressed={recipeOrigin === "shared"}
          >
            No
          </button>
        </div>
      </div>

      {recipeOrigin === "shared" && (
        <div className={styles.sharedFields}>
          <div className={styles.formGroup}>
            <label htmlFor="shared-source" className={styles.label}>
              Source
            </label>
            <input
              id="shared-source"
              type="text"
              placeholder="Enter the source"
              value={sharedSource}
              onChange={(event) => onSharedSourceChange(event.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="shared-source-link" className={styles.label}>
              Link
            </label>
            <input
              id="shared-source-link"
              type="url"
              placeholder="Optional reference link"
              value={sharedSourceLink}
              onChange={(event) => onSharedSourceLinkChange(event.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      )}
    </section>
  );
}
