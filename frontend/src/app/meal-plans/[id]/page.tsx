"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSaved } from "../../contexts/SavedContext";
import { toastError, toastSuccess } from "../../components/toast/toast";
import { authFetch } from "../../utils/authSession";
import { enrichRecipesWithMockImages } from "../../utils/recipeImageUtils";
import { matchesPinyinSearch } from "../../utils/pinyinSearch";
import styles from "./page.module.css";

type MealType = "breakfast" | "lunch" | "dinner";
type RecipeSource = "plan" | "website" | "saved";

interface Ingredient {
  name: string;
  quantity: string;
}

interface Recipe {
  id: string;
  _id?: string;
  title: string;
  description: string;
  image?: string;
  mainIngredients?: Ingredient[];
  seasonings?: Ingredient[];
}

interface Person {
  name: string;
  modifier: number;
}

interface PlannedMeal {
  mealType: MealType;
  recipes: Recipe[];
}

interface PlannedDay {
  dayNumber: number;
  meals: PlannedMeal[];
}

interface MealPlan {
  _id: string;
  userId: string;
  name: string;
  people: Person[];
  numberOfDays: number;
  mealTypes: MealType[];
  totalMealsNeeded: number;
  days?: PlannedDay[];
  recipes?: Recipe[];
  checkedIngredients: string[];
  createdAt: string;
  updatedAt: string;
}

interface ActiveSlot {
  dayNumber: number;
  mealType: MealType;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const SOURCE_TABS: { id: RecipeSource; label: string }[] = [
  { id: "plan", label: "This Plan" },
  { id: "website", label: "Website" },
  { id: "saved", label: "Saved" },
];

function getRecipeId(recipe: Recipe) {
  return recipe._id || recipe.id;
}

function titleCaseMeal(type: MealType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function uniqueRecipes(recipes: Recipe[]) {
  const seen = new Set<string>();
  return recipes.filter((recipe) => {
    const id = getRecipeId(recipe);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeMealTypes(types?: MealType[]): MealType[] {
  const requestedTypes = new Set(types || []);
  const filtered = MEAL_TYPES.filter((type) => requestedTypes.has(type));
  return filtered.length > 0 ? filtered : ["dinner"];
}

function normalizePlan(rawPlan: MealPlan): MealPlan {
  const mealTypes = normalizeMealTypes(rawPlan.mealTypes);
  const dayCount = Math.max(1, rawPlan.numberOfDays || rawPlan.days?.length || 1);
  const existingDays = rawPlan.days || [];
  const inboxRecipes = enrichRecipesWithMockImages<Recipe>((rawPlan.recipes || []) as Recipe[]);

  const days = Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    const existingDay = existingDays.find((day) => day.dayNumber === dayNumber);

    return {
      dayNumber,
      meals: mealTypes.map((mealType) => {
        const existingMeal = existingDay?.meals?.find((meal) => meal.mealType === mealType);
        return {
          mealType,
          recipes: enrichRecipesWithMockImages<Recipe>((existingMeal?.recipes || []) as Recipe[]),
        };
      }),
    };
  });

  return {
    ...rawPlan,
    people: rawPlan.people?.length ? rawPlan.people : [{ name: "Person 1", modifier: 1 }],
    numberOfDays: dayCount,
    mealTypes,
    totalMealsNeeded: dayCount * mealTypes.length,
    days,
    recipes: inboxRecipes,
  };
}

function serializeDays(days: PlannedDay[]) {
  return days.map((day) => ({
    dayNumber: day.dayNumber,
    meals: day.meals.map((meal) => ({
      mealType: meal.mealType,
      recipes: meal.recipes.map(getRecipeId).filter(Boolean),
    })),
  }));
}

export default function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { savedRecipes, fetchSaved } = useSaved();
  const [planId, setPlanId] = useState("");
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recipeSource, setRecipeSource] = useState<RecipeSource>("website");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [settings, setSettings] = useState({
    name: "",
    peopleCount: 1,
    numberOfDays: 1,
    mealTypes: ["dinner"] as MealType[],
  });

  useEffect(() => {
    params.then((value) => setPlanId(value.id));
  }, [params]);

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!planId) return;

    async function fetchPlan() {
      setLoading(true);
      setError("");
      try {
        const response = await authFetch(`/api/meal-plans/${planId}`);
        if (!response.ok) throw new Error("Failed to fetch meal plan");
        const data = await response.json();
        const normalizedPlan = normalizePlan(data.plan);
        setPlan(normalizedPlan);
        setSettings({
          name: normalizedPlan.name,
          peopleCount: normalizedPlan.people.length,
          numberOfDays: normalizedPlan.numberOfDays,
          mealTypes: normalizedPlan.mealTypes,
        });
        setActiveSlot({ dayNumber: 1, mealType: normalizedPlan.mealTypes[0] });
      } catch (err: any) {
        setError(err.message || "Failed to load meal plan");
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [planId]);

  useEffect(() => {
    async function fetchRecipes() {
      setLoadingRecipes(true);
      try {
        const response = await authFetch("/api/recipes?limit=1000");
        if (!response.ok) throw new Error("Failed to fetch recipes");
        const data = await response.json();
        setAllRecipes(enrichRecipesWithMockImages<Recipe>((data.recipes || []) as Recipe[]));
      } catch (err) {
        console.error("Failed to load recipe library", err);
      } finally {
        setLoadingRecipes(false);
      }
    }

    fetchRecipes();
  }, []);

  const recipesInPlan = useMemo(() => {
    if (!plan) return [];
    const scheduledRecipes = (plan.days || []).flatMap((day) => day.meals.flatMap((meal) => meal.recipes));
    return uniqueRecipes([...scheduledRecipes, ...(plan.recipes || [])]);
  }, [plan]);

  const ingredientList = useMemo(() => {
    const ingredients = new Map<string, { name: string; quantities: string[]; sources: string[] }>();

    recipesInPlan.forEach((recipe) => {
      [...(recipe.mainIngredients || []), ...(recipe.seasonings || [])].forEach((ingredient) => {
        const key = ingredient.name.toLowerCase();
        const current = ingredients.get(key) || { name: ingredient.name, quantities: [], sources: [] };
        if (ingredient.quantity) current.quantities.push(ingredient.quantity);
        if (!current.sources.includes(recipe.title)) current.sources.push(recipe.title);
        ingredients.set(key, current);
      });
    });

    return Array.from(ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipesInPlan]);

  const sourceRecipes = useMemo(() => {
    if (recipeSource === "plan") return recipesInPlan;
    if (recipeSource === "saved") return savedRecipes as Recipe[];
    return allRecipes;
  }, [allRecipes, recipeSource, recipesInPlan, savedRecipes]);

  const filteredSourceRecipes = useMemo(() => {
    const query = recipeSearch.trim();
    if (!query) return sourceRecipes;
    return sourceRecipes.filter((recipe) => matchesPinyinSearch(query, recipe.title) || matchesPinyinSearch(query, recipe.description || ""));
  }, [recipeSearch, sourceRecipes]);

  async function savePlan(nextPlan: MealPlan, successMessage: string) {
    setSaving(true);
    try {
      const response = await authFetch(`/api/meal-plans/${nextPlan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: serializeDays(nextPlan.days || []) }),
      });
      if (!response.ok) throw new Error("Failed to update meal plan");
      const data = await response.json();
      setPlan(normalizePlan(data.plan));
      toastSuccess(successMessage);
      return true;
    } catch (err: any) {
      toastError(err.message || "Could not update meal plan");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    if (!plan) return;
    if (!settings.name.trim()) {
      toastError("Name the meal plan before saving");
      return;
    }
    if (settings.mealTypes.length === 0) {
      toastError("Choose at least one meal type");
      return;
    }

    const people = Array.from({ length: settings.peopleCount }, (_, index) => ({
      name: plan.people[index]?.name || `Person ${index + 1}`,
      modifier: 1,
    }));
    const nextDays = normalizePlan({
      ...plan,
      name: settings.name.trim(),
      people,
      numberOfDays: settings.numberOfDays,
      mealTypes: settings.mealTypes,
    }).days || [];

    setSaving(true);
    try {
      const response = await authFetch(`/api/meal-plans/${plan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settings.name.trim(),
          people,
          numberOfDays: settings.numberOfDays,
          mealTypes: settings.mealTypes,
          days: serializeDays(nextDays),
        }),
      });
      if (!response.ok) throw new Error("Failed to save plan settings");
      const data = await response.json();
      const normalizedPlan = normalizePlan(data.plan);
      setPlan(normalizedPlan);
      setActiveSlot({ dayNumber: 1, mealType: normalizedPlan.mealTypes[0] });
      toastSuccess("Meal plan updated");
    } catch (err: any) {
      toastError(err.message || "Could not save plan settings");
    } finally {
      setSaving(false);
    }
  }

  function toggleMealType(type: MealType) {
    setSettings((current) => {
      const mealTypes = current.mealTypes.includes(type)
        ? current.mealTypes.filter((mealType) => mealType !== type)
        : [...current.mealTypes, type];
      return { ...current, mealTypes: mealTypes.length > 0 ? mealTypes : current.mealTypes };
    });
  }

  function openRecipePicker(dayNumber: number, mealType: MealType) {
    setActiveSlot({ dayNumber, mealType });
    setPickerOpen(true);
  }

  async function addRecipeToActiveMeal(recipe: Recipe) {
    if (!plan || !activeSlot) return;
    const recipeId = getRecipeId(recipe);
    const nextPlan = {
      ...plan,
      days: (plan.days || []).map((day) => {
        if (day.dayNumber !== activeSlot.dayNumber) return day;
        return {
          ...day,
          meals: day.meals.map((meal) => {
            if (meal.mealType !== activeSlot.mealType) return meal;
            if (meal.recipes.some((item) => getRecipeId(item) === recipeId)) return meal;
            return { ...meal, recipes: [...meal.recipes, recipe] };
          }),
        };
      }),
    };

    const saved = await savePlan(nextPlan, "Recipe added to meal");
    if (saved) setPickerOpen(false);
  }

  async function removeRecipeFromMeal(dayNumber: number, mealType: MealType, recipeId: string) {
    if (!plan) return;
    const nextPlan = {
      ...plan,
      days: (plan.days || []).map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        return {
          ...day,
          meals: day.meals.map((meal) => {
            if (meal.mealType !== mealType) return meal;
            return { ...meal, recipes: meal.recipes.filter((recipe) => getRecipeId(recipe) !== recipeId) };
          }),
        };
      }),
    };

    await savePlan(nextPlan, "Recipe removed");
  }

  if (loading) {
    return <main className={styles.page}><p className={styles.loading}>Loading...</p></main>;
  }

  if (error || !plan) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <p>{error || "Meal plan not found"}</p>
          <Link href="/meal-plans" className={styles.primaryLink}>Back to Meal Plans</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/meal-plans" className={styles.backLink}>
          <span className="material-symbols-outlined">arrow_back</span>
          Meal Plans
        </Link>
        <div>
          <p className={styles.kicker}>Planning</p>
          <h1>{plan.name}</h1>
        </div>
      </header>

      <section className={styles.settingsPanel}>
        <label className={styles.field}>
          <span>Name</span>
          <input value={settings.name} onChange={(event) => setSettings((current) => ({ ...current, name: event.target.value }))} />
        </label>

        <div className={styles.inlineFields}>
          <label className={styles.field}>
            <span>People</span>
            <input type="number" min="1" value={settings.peopleCount} onChange={(event) => setSettings((current) => ({ ...current, peopleCount: Math.max(1, parseInt(event.target.value) || 1) }))} />
          </label>
          <label className={styles.field}>
            <span>Days</span>
            <input type="number" min="1" value={settings.numberOfDays} onChange={(event) => setSettings((current) => ({ ...current, numberOfDays: Math.max(1, parseInt(event.target.value) || 1) }))} />
          </label>
        </div>

        <div className={styles.field}>
          <span>Meal Types</span>
          <div className={styles.mealTypeGrid}>
            {MEAL_TYPES.map((type) => (
              <label key={type} className={styles.mealTypeOption}>
                <input type="checkbox" checked={settings.mealTypes.includes(type)} onChange={() => toggleMealType(type)} />
                <span>{titleCaseMeal(type)}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="button" className={styles.saveButton} onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Plan"}
        </button>
      </section>

      <section className={styles.plannerShell}>
        <div className={styles.dayColumn}>
          {(plan.days || []).map((day) => (
            <section key={day.dayNumber} className={styles.dayCard}>
              <h2>Day {day.dayNumber}</h2>
              <div className={styles.mealList}>
                {day.meals.map((meal) => {
                  const active = activeSlot?.dayNumber === day.dayNumber && activeSlot.mealType === meal.mealType;
                  return (
                    <div key={`${day.dayNumber}-${meal.mealType}`} className={`${styles.mealCard} ${active ? styles.mealCardActive : ""}`}>
                      <div className={styles.mealHeader}>
                        <div>
                          <h3>{titleCaseMeal(meal.mealType)} ({meal.recipes.length})</h3>
                        </div>
                        <button type="button" onClick={() => openRecipePicker(day.dayNumber, meal.mealType)} aria-label={`Add recipe to Day ${day.dayNumber} ${titleCaseMeal(meal.mealType)}`}>
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>

                      {meal.recipes.length === 0 ? (
                        <p className={styles.emptyMeal}>No recipes yet</p>
                      ) : (
                        <div className={styles.scheduledRecipes}>
                          {meal.recipes.map((recipe) => {
                            const recipeId = getRecipeId(recipe);
                            return (
                              <div key={recipeId} className={styles.scheduledRecipe}>
                                <Link href={`/recipes/${recipeId}`}>{recipe.title}</Link>
                                <button type="button" onClick={() => removeRecipeFromMeal(day.dayNumber, meal.mealType, recipeId)} aria-label="Remove recipe">
                                  <span className="material-symbols-outlined">close</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <button type="button" className={`${styles.panelScrim} ${pickerOpen ? styles.panelScrimOpen : ""}`} onClick={() => setPickerOpen(false)} aria-label="Close recipe search" />
        <aside className={`${styles.recipePanel} ${pickerOpen ? styles.recipePanelOpen : ""}`}>
          <div className={styles.recipePanelHeader}>
            <div>
              <p className={styles.kicker}>Add Recipes</p>
              <h2>{activeSlot ? `Day ${activeSlot.dayNumber} ${titleCaseMeal(activeSlot.mealType)}` : "Choose a meal"}</h2>
            </div>
            <button type="button" className={styles.closePickerButton} onClick={() => setPickerOpen(false)} aria-label="Close recipe search">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className={styles.sourceTabs}>
            {SOURCE_TABS.map((tab) => (
              <button key={tab.id} type="button" className={recipeSource === tab.id ? styles.sourceTabActive : ""} onClick={() => setRecipeSource(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          <input className={styles.recipeSearch} value={recipeSearch} onChange={(event) => setRecipeSearch(event.target.value)} placeholder={`Search ${SOURCE_TABS.find((tab) => tab.id === recipeSource)?.label.toLowerCase()}`} />

          <div className={styles.recipeResults}>
            {loadingRecipes && recipeSource === "website" ? (
              <p className={styles.loadingSmall}>Loading recipes...</p>
            ) : filteredSourceRecipes.length === 0 ? (
              <p className={styles.loadingSmall}>No recipes found</p>
            ) : (
              filteredSourceRecipes.slice(0, 80).map((recipe) => {
                const recipeId = getRecipeId(recipe);
                return (
                  <button key={recipeId} type="button" className={styles.recipeResult} onClick={() => addRecipeToActiveMeal(recipe)} disabled={!activeSlot || saving}>
                    {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <span className="material-symbols-outlined">restaurant</span>}
                    <span>{recipe.title}</span>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </section>

      {ingredientList.length > 0 && (
        <section className={styles.ingredientsPanel}>
          <h2>Ingredient List</h2>
          <div className={styles.ingredientList}>
            {ingredientList.map((ingredient) => (
              <div key={ingredient.name} className={styles.ingredientItem}>
                <strong>{ingredient.name}</strong>
                <span>{ingredient.quantities.join(" + ") || "As needed"}</span>
                <small>{ingredient.sources.join(", ")}</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}