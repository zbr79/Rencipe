"use client";

import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import styles from "./page.module.css";

interface Ingredient {
  name: string;
  quantity: string;
}

interface AggregatedIngredient {
  name: string;
  quantities: string[];
}

export default function CartPage() {
  const testUserId = "507f1f77bcf86cd799439011"; // Mock user ID for testing
  const { cartRecipes, cartCount, fetchCart, removeFromCart } = useCart();
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [aggregatedIngredients, setAggregatedIngredients] = useState<AggregatedIngredient[]>([]);

  useEffect(() => {
    fetchCart(testUserId);
  }, []);

  useEffect(() => {
    // Aggregate ingredients from all recipes in cart
    const ingredientMap: { [key: string]: string[] } = {};

    cartRecipes.forEach((recipe: any) => {
      // Aggregate main ingredients
      recipe.mainIngredients?.forEach((ing: Ingredient) => {
        if (!ingredientMap[ing.name]) {
          ingredientMap[ing.name] = [];
        }
        ingredientMap[ing.name].push(ing.quantity);
      });

      // Aggregate seasonings
      recipe.seasonings?.forEach((ing: Ingredient) => {
        if (!ingredientMap[ing.name]) {
          ingredientMap[ing.name] = [];
        }
        ingredientMap[ing.name].push(ing.quantity);
      });
    });

    const aggregated: AggregatedIngredient[] = Object.entries(ingredientMap).map(
      ([name, quantities]) => ({
        name,
        quantities,
      })
    );

    setAggregatedIngredients(aggregated.sort((a, b) => a.name.localeCompare(b.name)));
  }, [cartRecipes]);

  const handleRemove = async (recipeId: string) => {
    if (confirm("确定要移除这个食谱吗？")) {
      await removeFromCart(testUserId, recipeId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← 返回
        </Link>
        <h1 className={styles.title}>购物车</h1>
        <div className={styles.badge}>{cartCount}</div>
      </div>

      {cartCount === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>购物车为空</h2>
          <p>添加食谱到购物车来管理所需食材</p>
          <Link href="/recipes" className={styles.emptyButton}>
            浏览食谱
          </Link>
        </div>
      ) : (
        <>
          {/* Cart Recipes Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>购物车食谱 ({cartCount})</h2>
            <div className={styles.recipesList}>
              {cartRecipes.map((recipe: any) => (
                <div key={recipe._id || recipe.id} className={styles.recipeCard}>
                  {recipe.image && (
                    <img src={recipe.image} alt={recipe.title} className={styles.recipeImage} />
                  )}
                  <div className={styles.recipeContent}>
                    <h3 className={styles.recipeName}>{recipe.title}</h3>
                    <p className={styles.recipeDesc}>{recipe.description}</p>
                    <div className={styles.recipeFooter}>
                      <span className={styles.servings}>份量: {recipe.servings}</span>
                      <button
                        onClick={() => handleRemove(recipe._id || recipe.id)}
                        className={styles.removeBtn}
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aggregated Ingredients Section */}
          <div className={styles.section}>
            <div className={styles.ingredientsHeader}>
              <h2 className={styles.sectionTitle}>食材汇总</h2>
              <button
                onClick={() => setShowAllMaterials(!showAllMaterials)}
                className={styles.seeAllBtn}
              >
                📋 {showAllMaterials ? "收起" : "查看所有"}
              </button>
            </div>

            {showAllMaterials && (
              <div className={styles.allMaterialsView}>
                <div className={styles.materialsHeader}>
                  <h3>所需食材清单</h3>
                </div>
                <ul className={styles.ingredientsList}>
                  {aggregatedIngredients.map((ing, idx) => (
                    <li key={idx} className={styles.ingredientItem}>
                      <input type="checkbox" id={`ing-${idx}`} />
                      <label htmlFor={`ing-${idx}`}>
                        <strong>{ing.name}</strong>
                        <span className={styles.quantities}>
                          {ing.quantities.join(" + ")}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
