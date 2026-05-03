"use client";

import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useSaved } from "../contexts/SavedContext";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { cartRecipes, cartCount, fetchCart, removeFromCart, clearCart } = useCart();
  const { createMealPlan, addRecipeToMealPlan } = useSaved();
  const [aggregatedIngredients, setAggregatedIngredients] = useState<AggregatedIngredient[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

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
    if (confirm("Remove this recipe?")) {
      await removeFromCart(testUserId, recipeId);
    }
  };

  const handleCheckout = async () => {
    if (cartCount === 0) return;

    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const today = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(new Date());
      const plan = await createMealPlan(
        testUserId,
        1,
        Math.max(1, cartCount),
        ["dinner"],
        `Cart Meal Plan - ${today}`
      );

      await Promise.all(
        cartRecipes.map((recipe: any) => addRecipeToMealPlan(plan._id, recipe._id || recipe.id))
      );
      await clearCart(testUserId);
      router.push(`/meal-plans/${plan._id}`);
    } catch (error: any) {
      setCheckoutError(error.message || "Unable to create meal plan from cart.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← Back
        </Link>
        <h1 className={styles.title}>Shopping Cart</h1>
        <div className={styles.badge}>{cartCount}</div>
      </div>

      {cartCount === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>Cart is Empty</h2>
          <p>Add recipes to your cart to organize needed ingredients.</p>
          <Link href="/recipes" className={styles.emptyButton}>
            Browse Recipes
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.checkoutPanel}>
            <div>
              <h2>Ready to plan?</h2>
              <p>Checkout will create a Meal Plan using every recipe in this cart.</p>
            </div>
            <button type="button" className={styles.checkoutButton} onClick={handleCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Creating..." : "Create Meal Plan"}
            </button>
          </div>

          {checkoutError && <div className={styles.errorBanner}>{checkoutError}</div>}

          {/* Cart Recipes Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Cart Recipes ({cartCount})</h2>
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
                      <span className={styles.servings}>Servings: {recipe.servings}</span>
                      <button
                        onClick={() => handleRemove(recipe._id || recipe.id)}
                        className={styles.removeBtn}
                      >
                        Remove
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
              <h2 className={styles.sectionTitle}>Ingredient Summary</h2>
              <span className={styles.itemCount}>{aggregatedIngredients.length} items</span>
            </div>

            <div className={styles.allMaterialsView}>
              <div className={styles.materialsHeader}>
                <h3>Ingredient List</h3>
              </div>
              <ul className={styles.ingredientsList}>
                {aggregatedIngredients.map((ing, idx) => (
                  <li key={idx} className={styles.ingredientItem}>
                    <span className={styles.ingredientDot} aria-hidden="true" />
                    <div>
                      <strong>{ing.name}</strong>
                      <span className={styles.quantities}>
                        {ing.quantities.join(" + ")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
