"use client";

import { useState, useEffect } from "react";
import styles from "./recipe-selection-modal.module.css";
import { matchesPinyinSearch } from "../../../utils/pinyinSearch";

interface Recipe {
  id: string;
  title: string;
  description: string;
  image?: string;
  component: boolean;
  mainIngredients: Array<{ name: string; quantity: string }>;
  seasonings: Array<{ name: string; quantity: string }>;
}

interface RecipeSelectionModalProps {
  isOpen: boolean;
  recipes: Recipe[];
  loading: boolean;
  selectedId: string;
  onSelect: (recipeId: string) => void;
  onClose: () => void;
  title: string;
}

export default function RecipeSelectionModal({
  isOpen,
  recipes,
  loading,
  selectedId,
  onSelect,
  onClose,
  title,
}: RecipeSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Debug: Log when modal opens or recipes change
  useEffect(() => {
    if (isOpen) {
      console.log(`RecipeSelectionModal opened: ${title}, recipes: ${recipes.length}, loading: ${loading}`);
    }
  }, [isOpen, recipes.length, loading, title]);

  // Filter recipes - only show components, with pinyin search
  const filteredRecipes = recipes.filter((recipe) => {
    // Must be a component recipe
    if (!recipe.component) {
      return false;
    }
    // If no search term, show all component recipes
    if (!searchTerm.trim()) {
      return true;
    }
    // Use pinyin search
    return matchesPinyinSearch(searchTerm, recipe.title) || matchesPinyinSearch(searchTerm, recipe.description);
  });

  const handleSelectRecipe = (recipeId: string) => {
    onSelect(recipeId);
    setSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        <div className={styles.recipeList}>
          {loading && <p className={styles.loading}>Loading recipes...</p>}

          {!loading && recipes.length === 0 && (
            <p className={styles.empty}>No available recipes</p>
          )}

          {!loading && recipes.length > 0 && filteredRecipes.length === 0 && (
            <p className={styles.empty}>No matching recipes found</p>
          )}

          {!loading && filteredRecipes.length > 0 &&
            filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`${styles.recipeItem} ${
                  selectedId === recipe.id ? styles.selected : ""
                }`}
                onClick={() => handleSelectRecipe(recipe.id)}
              >
                {recipe.image && (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className={styles.recipeImage}
                  />
                )}
                <div className={styles.recipeInfo}>
                  <h3 className={styles.recipeName}>{recipe.title}</h3>
                  {recipe.description && (
                    <p className={styles.recipeDescription}>{recipe.description}</p>
                  )}
                  {recipe.mainIngredients && recipe.mainIngredients.length > 0 && (
                    <p className={styles.recipeIngredients}>
                      Main ingredients: {recipe.mainIngredients.map((ing) => ing.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className={styles.checkmark}>
                  {selectedId === recipe.id && "✓"}
                </div>
              </div>
            ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.confirmBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
