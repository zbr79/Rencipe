"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import styles from "../recipes/page.module.css";
import { matchesPinyinSearch } from "../utils/pinyinSearch";
import { getVisibleTags } from "../utils/recipeTags";

export default function SavedPage() {
  const {
    savedRecipes,
    loadingSaved,
    fetchSaved,
    mealPlans,
    loadingPlans,
    fetchMealPlans,
    createMealPlan,
    renameMealPlan,
    deleteMealPlan,
  } = useSaved();

  const [activeTab, setActiveTab] = useState<"recipes" | "plans">("recipes");
  const [filters, setFilters] = useState({
    searchTerm: "",
  });
  const [renamingPlanId, setRenamingPlanId] = useState<string | null>(null);
  const [renamingPlanName, setRenamingPlanName] = useState("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchSaved(userId);
    fetchMealPlans(userId);
  }, []);

  const filteredRecipes = savedRecipes.filter((recipe) => {
    const matchesSearch =
      !filters.searchTerm ||
      matchesPinyinSearch(filters.searchTerm, recipe.title) ||
      matchesPinyinSearch(filters.searchTerm, recipe.description);

    return matchesSearch;
  });

  const filteredPlans = mealPlans.filter((plan) => {
    const matchesSearch =
      !filters.searchTerm ||
      matchesPinyinSearch(filters.searchTerm, plan.name);

    return matchesSearch;
  });

  const handleCreateMealPlan = async () => {
    setIsCreatingPlan(true);
    try {
      await createMealPlan(userId, 1, 1, ["lunch"], "New Plan");
      await fetchMealPlans(userId);
    } catch (error) {
      console.error("Failed to create meal plan:", error);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleRenamePlan = async (planId: string) => {
    if (!renamingPlanName.trim()) return;

    try {
      await renameMealPlan(planId, renamingPlanName);
      setRenamingPlanId(null);
      setRenamingPlanName("");
      await fetchMealPlans(userId);
    } catch (error) {
      console.error("Failed to rename plan:", error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Delete this plan?")) return;

    try {
      await deleteMealPlan(planId);
      await fetchMealPlans(userId);
    } catch (error) {
      console.error("Failed to delete plan:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.segmentedTabs}>
        <button
          onClick={() => setActiveTab("recipes")}
          className={`${styles.segmentedTab} ${activeTab === "recipes" ? styles.segmentedTabActive : ""}`}
        >
          Recipes ({savedRecipes.length})
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`${styles.segmentedTab} ${activeTab === "plans" ? styles.segmentedTabActive : ""}`}
        >
          Meal Plans ({mealPlans.length})
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder={
            activeTab === "recipes" ? "Search saved recipes" : "Search meal plans"
          }
          value={filters.searchTerm}
          onChange={(e) =>
            setFilters({ ...filters, searchTerm: e.target.value })
          }
          className={styles.searchInput}
        />
      </div>

      {/* ===== Recipes Tab ===== */}
      {activeTab === "recipes" && (
        <>
          <div className={styles.count}>
            Saved {filteredRecipes.length} recipes
          </div>

          {loadingSaved && <p className={styles.loading}>Loading...</p>}

          {!loadingSaved && filteredRecipes.length === 0 && (
            <div className={styles.empty}>
              <p>
                {savedRecipes.length === 0
                  ? "You have not saved any recipes yet"
                  : "No matching recipes found"}
              </p>
              <Link href="/recipes" className={styles.createLink}>
                Browse Recipes
              </Link>
            </div>
          )}

          {/* Saved Recipes Grid */}
          <div className={styles.grid}>
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe._id}
                href={`/recipes/${recipe._id}`}
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

                <p className={styles.description}>
                  {recipe.description || ""}
                </p>

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
        </>
      )}

      {/* ===== Plan Tab ===== */}
      {activeTab === "plans" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                fontWeight: "500",
              }}
            >
              Total {filteredPlans.length} plans
            </div>
            <button
              onClick={handleCreateMealPlan}
              disabled={isCreatingPlan}
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: "6px",
                cursor: isCreatingPlan ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s ease",
                opacity: isCreatingPlan ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.2)",
              }}
              onMouseEnter={(e) => {
                if (!isCreatingPlan) {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(139, 92, 246, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              ✨ New Plan
            </button>
          </div>

          {loadingPlans && <p className={styles.loading}>Loading...</p>}

          {!loadingPlans && filteredPlans.length === 0 && (
            <div className={styles.empty}>
              <p>
                {mealPlans.length === 0
                  ? "You have not created any meal plans yet"
                  : "No matching plans found"}
              </p>
              <button
                onClick={handleCreateMealPlan}
                disabled={isCreatingPlan}
                style={{
                  background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  cursor: isCreatingPlan ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  opacity: isCreatingPlan ? 0.6 : 1,
                  boxShadow: "0 2px 8px rgba(139, 92, 246, 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!isCreatingPlan) {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(139, 92, 246, 0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isCreatingPlan ? "Creating..." : "✨ Create your first plan"}
              </button>
            </div>
          )}

          {/* Meal Plans List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredPlans.map((plan) => (
              <Link
                key={plan._id}
                href={`/meal-plans/${plan._id}`}
                style={{
                  background: "var(--card-bg)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  padding: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#8b5cf6";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ flex: 1 }}>
                  {renamingPlanId === plan._id ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={renamingPlanName}
                        onChange={(e) => setRenamingPlanName(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: "8px",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRenamePlan(plan._id);
                        }}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRenamingPlanId(null);
                        }}
                        style={{
                          background: "var(--border)",
                          color: "var(--foreground)",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ margin: "0 0 6px 0", color: "var(--foreground)", fontSize: "16px", fontWeight: "600" }}>{plan.name}</h3>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          fontWeight: "500",
                        }}
                      >
                        📚 {plan.combinations.length} recipes
                      </p>
                    </div>
                  )}
                </div>

                {renamingPlanId !== plan._id && (
                  <div
                    style={{ display: "flex", gap: "8px", marginLeft: "16px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeletePlan(plan._id);
                      }}
                      style={{
                        background: "var(--hover-bg)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--card-bg)";
                        e.currentTarget.style.color = "var(--foreground)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--hover-bg)";
                        e.currentTarget.style.color = "var(--foreground)";
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
