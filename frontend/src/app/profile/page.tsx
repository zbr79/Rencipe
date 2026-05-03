"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../recipes/page.module.css";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";
import { matchesPinyinSearch } from "../utils/pinyinSearch";
import { getVisibleTags } from "../utils/recipeTags";
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
  authorId: string;
  image?: string;
}

export default function ProfilePage() {
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchUserRecipes();
  }, []);

  const fetchUserRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/recipes?limit=1000`);

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const data = await response.json();
      // Filter recipes by user's authorId
      const myRecipes = data.recipes?.filter((recipe: Recipe) => recipe.authorId === userId) || [];
      // Enrich with mock images
      const enrichedRecipes = enrichRecipesWithMockImages<Recipe>(myRecipes);
      setUserRecipes(enrichedRecipes);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalLikes = userRecipes.reduce((sum, recipe) => sum + recipe.likes, 0);
  const totalViews = userRecipes.reduce((sum, recipe) => sum + recipe.views, 0);
  const averageRating =
    userRecipes.filter((r) => r.ratingCount > 0).length > 0
      ? (
          userRecipes.filter((r) => r.ratingCount > 0).reduce((sum, recipe) => sum + recipe.ratingAverage, 0) /
          userRecipes.filter((r) => r.ratingCount > 0).length
        ).toFixed(1)
      : "N/A";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Profile</p>
          <h1>Demo Cook</h1>
          <p className={styles.headerMeta}>Published recipe activity for the current demo user.</p>
        </div>
        <Link href="/create" className={styles.createButton}>
          <span className="material-symbols-outlined">add</span>
          Create
        </Link>
      </header>

      {error && <div className={styles.error}>Error: {error}</div>}

      {/* Profile Stats */}
      <div className={styles.statsPanel}>
        <div className={styles.statTile}>
          <strong>{userRecipes.length}</strong>
          <span>Published Recipes</span>
        </div>
        <div className={styles.statTile}>
          <strong>{totalLikes}</strong>
          <span>Likes</span>
        </div>
        <div className={styles.statTile}>
          <strong>{totalViews}</strong>
          <span>Views</span>
        </div>
        <div className={styles.statTile}>
          <strong>{averageRating}</strong>
          <span>Average Rating</span>
        </div>
      </div>

      {/* Recipes Count */}
      <div className={styles.count}>
        Published {userRecipes.length} recipes
      </div>

      {/* Loading State */}
      {loading && <p className={styles.loading}>Loading...</p>}

      {/* Empty State */}
      {!loading && userRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>You have not published any recipes yet</p>
          <Link href="/create" className={styles.createLink}>
            Create your first recipe
          </Link>
        </div>
      )}

      {/* User Recipes Grid */}
      <div className={styles.grid}>
        {userRecipes.map((recipe) => (
          <Link
            key={recipe._id || recipe.id}
            href={`/recipes/${recipe._id || recipe.id}`}
            className={styles.card}
          >
            {recipe.image && (
              <div className={styles.cardImage}>
                <img src={recipe.image} alt={recipe.title} />
              </div>
            )}
            <div className={styles.cardHeader}>
              <h3>{recipe.title}</h3>
            </div>

            <p className={styles.description}>{recipe.description || ""}</p>

            <div className={styles.meta}>
              <span className={styles.metaItem}>
                🍽️ {recipe.servings || 1} servings
              </span>
            </div>

            {getVisibleTags(recipe.tags).length > 0 && (
              <div className={styles.tags}>
                {getVisibleTags(recipe.tags).slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {getVisibleTags(recipe.tags).length > 3 && (
                  <span className={styles.tag}>
                    +{getVisibleTags(recipe.tags).length - 3}
                  </span>
                )}
              </div>
            )}

            <div className={styles.stats}>
              <span>{recipe.likes} saves</span>
              <span>{recipe.views} views</span>
              {recipe.ratingCount > 0 && (
                <span>{recipe.ratingAverage.toFixed(1)} rating</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
