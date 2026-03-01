"use client";

import styles from "./styles.module.css";

interface Ingredient {
  name: string;
  quantity: string;
}

interface IngredientsSectionProps {
  ingredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  onRemoveIngredient: (index: number) => void;
  onAddIngredient: () => void;
}

export default function IngredientsSection({
  ingredients,
  onIngredientsChange,
  onRemoveIngredient,
  onAddIngredient,
}: IngredientsSectionProps) {
  const handleEditChange = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    onIngredientsChange(updated);
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>用料</h2>
        <span className={styles.infoIcon}>ⓘ</span>
      </div>

      <div className={styles.ingredientsList}>
        {ingredients.map((ing, idx) => (
          <div key={idx} className={styles.ingredientRow}>
            <input
              type="text"
              placeholder="材料"
              value={ing.name}
              onChange={(e) => handleEditChange(idx, "name", e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="用量"
              value={ing.quantity}
              onChange={(e) => handleEditChange(idx, "quantity", e.target.value)}
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => onRemoveIngredient(idx)}
              className={styles.removeBtn}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAddIngredient} className={styles.addBtn}>
        + 添加配料
      </button>
    </section>
  );
}
