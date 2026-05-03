"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../search/page.module.css";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";
import { getPrimaryRecipeLabel, getVisibleTags, hasHealthTag } from "../utils/recipeTags";
import { authFetch } from "../utils/authSession";

interface Recipe {
  id: string;
  _id?: string;
  title: string;
  description: string;
  servings: number;
  tags: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  image?: string;
}

const categoryTabs = [
  { id: "all", label: "All", icon: "tune" },
  { id: "healthy", label: "Healthy", icon: "favorite" },
  { id: "quick", label: "Quick", icon: "bolt" },
  { id: "dinner", label: "Dinner", icon: "dinner_dining" },
  { id: "seafood", label: "Seafood", icon: "set_meal" },
  { id: "vegetarian", label: "Vegetarian", icon: "eco" },
];

const featureCategories = [
  { id: "all", label: "Recommended", icon: "local_offer" },
  { id: "all", label: "New", icon: "auto_awesome" },
  { id: "all", label: "Popular", icon: "local_fire_department" },
  { id: "healthy", label: "Healthy", icon: "nutrition" },
  { id: "protein", label: "Protein", icon: "egg_alt" },
];

function matchesCategory(recipe: Recipe, category: string) {
  const tags = recipe.tags || [];
  if (category === "healthy") return hasHealthTag(tags);
  if (category === "quick") return tags.some((tag) => ["Quick", "Easy", "Meal prep"].includes(tag));
  if (category === "dinner") return tags.some((tag) => ["Dinner", "Family dinner", "Chicken", "Protein"].includes(tag));
  if (category === "seafood") return tags.some((tag) => ["Seafood", "Salmon", "Shrimp"].includes(tag));
  if (category === "vegetarian") return tags.some((tag) => ["Vegetarian", "Vegetable", "Salad"].includes(tag));
  if (category === "protein") return tags.some((tag) => ["High Protein", "Protein", "Chicken", "Salmon"].includes(tag));
  return true;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  const fetchAllRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/recipes?limit=1000`);

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const data = await response.json();
      setAllRecipes(enrichRecipesWithMockImages<Recipe>((data.recipes || []) as Recipe[]));
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = allRecipes.filter((recipe) => matchesCategory(recipe, selectedCategory));

  return (
    <main className={styles.page}>
      <header className={styles.searchHeader}>
        <button type="button" className={styles.backButton} onClick={() => router.back()} aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <button type="button" className={styles.searchBoxButton} onClick={() => router.push("/search")}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <span>Search recipes</span>
        </button>

        <Link href="/cart" className={styles.cartButton} aria-label="Shopping Cart">
          <span className="material-symbols-outlined">shopping_cart</span>
        </Link>
      </header>

      {error && <div className={styles.error}>Error: {error}</div>}

      <section className={styles.featureRail} aria-label="Browse categories">
        {featureCategories.map((category) => (
          <button
            key={`${category.label}-${category.id}`}
            type="button"
            className={styles.featureItem}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className={`material-symbols-outlined ${styles.featureIcon}`}>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </section>

      <div className={styles.categoryTabs}>
        {categoryTabs.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`${styles.categoryTab} ${selectedCategory === category.id ? styles.categoryTabActive : ""}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="material-symbols-outlined">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      <div className={styles.resultsHeader}>
        <h2>Categories</h2>
        <span>{filteredRecipes.length} recipes</span>
      </div>

      {loading && <p className={styles.loading}>Loading...</p>}

      {!loading && filteredRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>{allRecipes.length === 0 ? "No recipes yet" : "No recipes in this category"}</p>
          <button type="button" onClick={() => setSelectedCategory("all")} className={styles.secondaryButton}>
            Show all
          </button>
        </div>
      )}

      <div className={styles.recipeGrid}>
        {filteredRecipes.map((recipe, index) => (
          <Link
            key={recipe._id || recipe.id}
            href={`/recipes/${recipe._id || recipe.id}`}
            className={styles.recipeCard}
          >
            <span className={styles.discountBadge}>{index % 3 === 0 ? "New" : index % 3 === 1 ? "Popular" : "Fresh"}</span>
            {recipe.image && (
              <div className={styles.recipeImage}>
                <img src={recipe.image} alt={recipe.title} />
              </div>
            )}
            <div className={styles.recipeBody}>
              <div className={styles.recipeTopLine}>
                <span>{getPrimaryRecipeLabel(recipe.tags)}</span>
                <span>{recipe.servings || 1} servings</span>
              </div>
              <h3>{recipe.title}</h3>
              {getVisibleTags(recipe.tags).length > 0 && (
                <div className={styles.cardTags}>
                  {getVisibleTags(recipe.tags).slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}