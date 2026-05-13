"use client";

import styles from "./styles.module.css";

interface Ingredient {
  name: string;
  quantity: string;
}

interface IngredientsSectionProps {
  mainIngredients: Ingredient[];
  seasonings: Ingredient[];
  invalidMainIngredients?: boolean;
  onMainIngredientsChange: (ingredients: Ingredient[]) => void;
  onSeasoningsChange: (ingredients: Ingredient[]) => void;
  onRemoveMainIngredient: (index: number) => void;
  onAddMainIngredient: () => void;
  onRemoveSeasonings: (index: number) => void;
  onAddSeasonings: () => void;
}

export default function IngredientsSection({
  mainIngredients,
  seasonings,
  invalidMainIngredients = false,
  onMainIngredientsChange,
  onSeasoningsChange,
  onRemoveMainIngredient,
  onAddMainIngredient,
  onRemoveSeasonings,
  onAddSeasonings,
}: IngredientsSectionProps) {
  const handleMainEditChange = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...mainIngredients];
    updated[index] = { ...updated[index], [field]: value };
    onMainIngredientsChange(updated);
  };

  const handleSeasoningEditChange = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...seasonings];
    updated[index] = { ...updated[index], [field]: value };
    onSeasoningsChange(updated);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Ingredients</h2>
      </div>

      {/* Main Ingredients Section */}
      <div className={`${styles.subsection} ${invalidMainIngredients ? styles.subsectionInvalid : ""}`}>
        <h3 className={`${styles.subheading} ${invalidMainIngredients ? styles.subheadingInvalid : ""}`}>
          Main Ingredients
        </h3>
        <div className={styles.ingredientsList}>
          {mainIngredients.map((ing, idx) => (
            <div key={idx} className={styles.ingredientRow}>
              <input
                type="text"
                placeholder="Ingredient"
                value={ing.name}
                onChange={(e) => handleMainEditChange(idx, "name", e.target.value)}
                aria-invalid={invalidMainIngredients}
                className={`${styles.input} ${invalidMainIngredients ? styles.inputInvalid : ""}`}
              />
              <input
                type="text"
                placeholder="Amount"
                value={ing.quantity}
                onChange={(e) => handleMainEditChange(idx, "quantity", e.target.value)}
                aria-invalid={invalidMainIngredients}
                className={`${styles.input} ${invalidMainIngredients ? styles.inputInvalid : ""}`}
              />
              <button
                type="button"
                onClick={() => onRemoveMainIngredient(idx)}
                className={styles.removeBtn}
                aria-label="Remove main ingredient"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={onAddMainIngredient} className={styles.addBtn} aria-label="Add main ingredient">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Seasonings Section */}
      <div>
        <h3 className={styles.subheading}>
          Seasonings
        </h3>
        <div className={styles.ingredientsList}>
          {seasonings.map((ing, idx) => (
            <div key={idx} className={styles.ingredientRow}>
              <input
                type="text"
                placeholder="Ingredient"
                value={ing.name}
                onChange={(e) => handleSeasoningEditChange(idx, "name", e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Amount"
                value={ing.quantity}
                onChange={(e) => handleSeasoningEditChange(idx, "quantity", e.target.value)}
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => onRemoveSeasonings(idx)}
                className={styles.removeBtn}
                aria-label="Remove seasoning"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={onAddSeasonings} className={styles.addBtn} aria-label="Add seasoning">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </section>
  );
}
