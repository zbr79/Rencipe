"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NumberOnlyInput from "../../components/NumberOnlyInput";
import BackButton from "../../components/BackButton";
import FloatingActionPanel from "../../components/FloatingActionPanel";
import { useConfirmDialog } from "../../components/ConfirmDialogProvider";
import { useSaved } from "../../contexts/SavedContext";
import { toastError, toastSuccess } from "../../components/toast/toast";
import { authFetch } from "../../utils/authSession";
import { enrichRecipesWithMockImages } from "../../utils/recipeImageUtils";
import { matchesPinyinSearch } from "../../utils/pinyinSearch";
import styles from "./page.module.css";

type MealType = "breakfast" | "lunch" | "dinner";
type MealEntryKind = "mealPlan" | "meal";
type RecipeSource = "plan" | "website" | "saved";
type IngredientViewMode = "combined" | "byRecipe";
type SettingsSaveState = "idle" | "saving" | "saved" | "error" | "blocked";

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
  kind?: MealEntryKind;
  userId: string;
  name: string;
  people: Person[];
  numberOfDays?: number;
  mealTypes?: MealType[];
  totalMealsNeeded?: number;
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

function getMealEntryKind(plan?: { kind?: MealEntryKind }) {
  return plan?.kind === "meal" ? "meal" : "mealPlan";
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
  const kind = getMealEntryKind(rawPlan);
  const inboxRecipes = enrichRecipesWithMockImages<Recipe>((rawPlan.recipes || []) as Recipe[]);

  if (kind === "meal") {
    return {
      ...rawPlan,
      kind,
      people: rawPlan.people?.length ? rawPlan.people : [{ name: "Person 1", modifier: 1 }],
      recipes: uniqueRecipes(inboxRecipes),
      mealTypes: [],
      days: [],
      totalMealsNeeded: inboxRecipes.length,
    };
  }

  const mealTypes = normalizeMealTypes(rawPlan.mealTypes);
  const dayCount = Math.max(1, rawPlan.numberOfDays || rawPlan.days?.length || 1);
  const existingDays = rawPlan.days || [];

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
    kind,
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

function serializeRecipes(recipes: Recipe[]) {
  return recipes.map(getRecipeId).filter(Boolean);
}

function getSettingsFromPlan(plan: MealPlan): {
  name: string;
  peopleCount: number;
  numberOfDays: number;
  mealTypes: MealType[];
} {
  return {
    name: plan.name,
    peopleCount: plan.people.length,
    numberOfDays: plan.numberOfDays || 1,
    mealTypes: plan.mealTypes?.length ? normalizeMealTypes(plan.mealTypes) : ["dinner"],
  };
}

function getInitialSlot(plan: MealPlan): ActiveSlot | null {
  if (getMealEntryKind(plan) === "meal") return null;

  return {
    dayNumber: plan.days?.[0]?.dayNumber || 1,
    mealType: plan.mealTypes?.[0] || "dinner",
  };
}

function getSettingsSignature(
  settings: { name: string; peopleCount: number; numberOfDays: number; mealTypes: MealType[] },
  entryKind: MealEntryKind
) {
  return JSON.stringify({
    name: settings.name.trim(),
    peopleCount: settings.peopleCount,
    ...(entryKind === "meal"
      ? {}
      : {
          numberOfDays: settings.numberOfDays,
          mealTypes: normalizeMealTypes(settings.mealTypes),
        }),
  });
}

function getSettingsValidationMessage(
  settings: { name: string; peopleCount: number; numberOfDays: number; mealTypes: MealType[] },
  entryKind: MealEntryKind
) {
  if (!settings.name.trim()) {
    return entryKind === "meal"
      ? "Autosave paused until the meal has a name."
      : "Autosave paused until the plan has a name.";
  }

  if (entryKind === "mealPlan" && settings.mealTypes.length === 0) {
    return "Autosave paused until at least one meal type is selected.";
  }

  return null;
}

export default function MealPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { savedRecipes, fetchSaved, deleteMealPlan } = useSaved();
  const { confirm, notify } = useConfirmDialog();
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
  const [ingredientViewMode, setIngredientViewMode] = useState<IngredientViewMode>("combined");
  const [settings, setSettings] = useState({
    name: "",
    peopleCount: 1,
    numberOfDays: 1,
    mealTypes: ["dinner"] as MealType[],
  });
  const [revertSettingsSnapshot, setRevertSettingsSnapshot] = useState<ReturnType<typeof getSettingsFromPlan> | null>(null);
  const [settingsSaveState, setSettingsSaveState] = useState<SettingsSaveState>("idle");
  const [settingsSaveMessage, setSettingsSaveMessage] = useState("");
  const settingsAutosaveTimerRef = useRef<number | null>(null);
  const lastSavedSettingsSignatureRef = useRef("");

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
        if (!response.ok) throw new Error("Failed to fetch plan");
        const data = await response.json();
        const normalizedPlan = normalizePlan(data.plan);
        const initialSettings = getSettingsFromPlan(normalizedPlan);
        setPlan(normalizedPlan);
        setSettings(initialSettings);
        setRevertSettingsSnapshot(initialSettings);
        lastSavedSettingsSignatureRef.current = getSettingsSignature(initialSettings, getMealEntryKind(normalizedPlan));
        setSettingsSaveState("saved");
        setSettingsSaveMessage("All changes saved.");
        setActiveSlot(getInitialSlot(normalizedPlan));
      } catch (err: any) {
        setError(err.message || "Failed to load plan");
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
    if (getMealEntryKind(plan) === "meal") {
      return uniqueRecipes(plan.recipes || []);
    }
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

  const ingredientsByRecipe = useMemo(() => {
    return recipesInPlan
      .map((recipe) => ({
        recipeId: getRecipeId(recipe),
        recipeTitle: recipe.title,
        ingredients: [...(recipe.mainIngredients || []), ...(recipe.seasonings || [])]
          .filter((ingredient) => ingredient.name.trim() || ingredient.quantity.trim())
          .map((ingredient) => ({
            name: ingredient.name.trim() || "Unnamed ingredient",
            quantity: ingredient.quantity.trim() || "As needed",
          })),
      }))
      .filter((recipeGroup) => recipeGroup.ingredients.length > 0);
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
      const body = getMealEntryKind(nextPlan) === "meal"
        ? { recipes: serializeRecipes(nextPlan.recipes || []) }
        : { days: serializeDays(nextPlan.days || []) };

      const response = await authFetch(`/api/meal-plans/${nextPlan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update plan");
      const data = await response.json();
      const normalizedPlan = normalizePlan(data.plan);
      setPlan(normalizedPlan);
      if (getMealEntryKind(normalizedPlan) === "meal") {
        setActiveSlot(null);
      }
      toastSuccess(successMessage);
      return true;
    } catch (err: any) {
      toastError(err.message || "Could not update plan");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCurrentPlan() {
    if (!plan) return;

    const entryKind = getMealEntryKind(plan);
    const itemName = entryKind === "meal" ? "meal" : "plan";
    const approved = await confirm({
      title: entryKind === "meal" ? "Delete meal" : "Delete plan",
      message: `Move this ${itemName} to Trash for 7 days?`,
      intent: "danger",
      confirmText: "Delete",
    });

    if (!approved) return;

    try {
      await deleteMealPlan(plan._id);
      router.push("/my-work?kind=trash");
    } catch (error) {
      console.error(`Failed to move ${itemName} to trash:`, error);
      await notify({
        title: "Delete failed",
        message: `Failed to move this ${itemName} to Trash.`,
        intent: "danger",
      });
    }
  }

  async function persistSettings(
    nextSettings: typeof settings,
    options?: {
      successMessage?: string;
      statusMessage?: string;
      errorMessage?: string;
    }
  ) {
    if (!plan) return false;

    const entryKind = getMealEntryKind(plan);
    const people = Array.from({ length: nextSettings.peopleCount }, (_, index) => ({
      name: plan.people[index]?.name || `Person ${index + 1}`,
      modifier: 1,
    }));

    setSaving(true);
    try {
      const response = await authFetch(`/api/meal-plans/${plan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          entryKind === "meal"
            ? {
                name: nextSettings.name.trim(),
                people,
              }
            : {
                name: nextSettings.name.trim(),
                people,
                numberOfDays: nextSettings.numberOfDays,
                mealTypes: nextSettings.mealTypes,
                days:
                  normalizePlan({
                    ...plan,
                    name: nextSettings.name.trim(),
                    people,
                    numberOfDays: nextSettings.numberOfDays,
                    mealTypes: nextSettings.mealTypes,
                  }).days?.map((day) => ({
                    dayNumber: day.dayNumber,
                    meals: day.meals.map((meal) => ({
                      mealType: meal.mealType,
                      recipes: meal.recipes.map(getRecipeId).filter(Boolean),
                    })),
                  })) || [],
              }
        ),
      });

      if (!response.ok) {
        throw new Error(entryKind === "meal" ? "Failed to save meal settings" : "Failed to save plan settings");
      }

      const data = await response.json();
      const normalizedPlan = normalizePlan(data.plan);
      const normalizedSettings = getSettingsFromPlan(normalizedPlan);
      setPlan(normalizedPlan);
      setSettings(normalizedSettings);
      lastSavedSettingsSignatureRef.current = getSettingsSignature(normalizedSettings, getMealEntryKind(normalizedPlan));
      setSettingsSaveState("saved");
      setSettingsSaveMessage(options?.statusMessage || "All changes saved.");
      setActiveSlot((current) => {
        if (getMealEntryKind(normalizedPlan) === "meal") {
          return null;
        }

        if (
          current
          && normalizedPlan.days?.some((day) => day.dayNumber === current.dayNumber)
          && normalizedPlan.mealTypes?.includes(current.mealType)
        ) {
          return current;
        }

        return getInitialSlot(normalizedPlan);
      });

      if (options?.successMessage) {
        toastSuccess(options.successMessage);
      }

      return true;
    } catch (err: any) {
      const nextMessage = err.message || options?.errorMessage || "Could not save settings";
      setSettingsSaveState("error");
      setSettingsSaveMessage(nextMessage);
      toastError(nextMessage);
      return false;
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

  function openMealRecipePicker() {
    setActiveSlot(null);
    setPickerOpen(true);
  }

  useEffect(() => {
    return () => {
      if (settingsAutosaveTimerRef.current) {
        window.clearTimeout(settingsAutosaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!plan || loading || saving) {
      return;
    }

    const entryKind = getMealEntryKind(plan);
    const nextSignature = getSettingsSignature(settings, entryKind);
    if (nextSignature === lastSavedSettingsSignatureRef.current) {
      if (settingsSaveState === "saving") {
        setSettingsSaveState("saved");
        setSettingsSaveMessage("All changes saved.");
      }
      return;
    }

    const validationMessage = getSettingsValidationMessage(settings, entryKind);
    if (validationMessage) {
      setSettingsSaveState("blocked");
      setSettingsSaveMessage(validationMessage);
      return;
    }

    setSettingsSaveState("saving");
    setSettingsSaveMessage("Saving changes...");

    const timeoutId = window.setTimeout(() => {
      void persistSettings(settings);
    }, 800);

    settingsAutosaveTimerRef.current = timeoutId;

    return () => {
      window.clearTimeout(timeoutId);
      if (settingsAutosaveTimerRef.current === timeoutId) {
        settingsAutosaveTimerRef.current = null;
      }
    };
  }, [loading, plan, saving, settings, settingsSaveState]);

  async function revertSettings() {
    if (!revertSettingsSnapshot) return;

    if (saving) {
      toastError("Wait for the current changes to finish saving.");
      return;
    }

    const reverted = await persistSettings(revertSettingsSnapshot, {
      successMessage: getMealEntryKind(plan || { kind: "mealPlan" } as MealPlan) === "meal" ? "Reverted meal settings" : "Reverted plan settings",
      statusMessage: "Original version restored.",
      errorMessage: "Could not revert settings.",
    });

    if (reverted) {
      setSettings(revertSettingsSnapshot);
    }
  }

  async function addRecipeToActiveMeal(recipe: Recipe) {
    if (!plan) return;
    const recipeId = getRecipeId(recipe);

    if (getMealEntryKind(plan) === "meal") {
      if ((plan.recipes || []).some((item) => getRecipeId(item) === recipeId)) return;

      const nextPlan = {
        ...plan,
        recipes: [...(plan.recipes || []), recipe],
      };

      const saved = await savePlan(nextPlan, "Recipe added to meal");
      if (saved) setPickerOpen(false);
      return;
    }

    if (!activeSlot) return;
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

  async function removeRecipeFromMeal(recipeId: string, dayNumber?: number, mealType?: MealType) {
    if (!plan) return;

    if (getMealEntryKind(plan) === "meal") {
      const nextPlan = {
        ...plan,
        recipes: (plan.recipes || []).filter((recipe) => getRecipeId(recipe) !== recipeId),
      };

      await savePlan(nextPlan, "Recipe removed");
      return;
    }

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
          <p>{error || "Plan not found"}</p>
          <BackButton fallbackHref="/meal-plans" className={styles.primaryLink} label="Back to Plans" />
        </div>
      </main>
    );
  }

  const isMeal = getMealEntryKind(plan) === "meal";
  const hasRevertableSettingsChanges = revertSettingsSnapshot
    ? getSettingsSignature(settings, isMeal ? "meal" : "mealPlan") !== getSettingsSignature(revertSettingsSnapshot, isMeal ? "meal" : "mealPlan")
    : false;

  return (
    <main className={styles.page}>
      {settingsSaveMessage && (
        <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 1000 }}>
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              color: settingsSaveState === "error" ? "var(--error)" : "var(--text-secondary)",
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${settingsSaveState === "error" ? "color-mix(in srgb, var(--error) 40%, var(--border))" : "var(--border)"}`,
              fontSize: "12px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {settingsSaveMessage}
          </div>
        </div>
      )}

      <header className={styles.header}>
        <BackButton fallbackHref={isMeal ? "/meal-plans?kind=meal" : "/meal-plans"} className={styles.backLink} label={isMeal ? "Meals" : "Plans"} />
        <div>
          {!isMeal && <p className={styles.kicker}>Planning</p>}
          <h1>{plan.name}</h1>
        </div>
      </header>

      <FloatingActionPanel
        ariaLabel={isMeal ? "Meal actions" : "Plan actions"}
        actions={[
          {
            id: "delete",
            icon: "delete",
            label: isMeal ? "Delete meal" : "Delete plan",
            onClick: () => void handleDeleteCurrentPlan(),
            disabled: saving,
            tone: "danger",
          },
          {
            id: "revert",
            icon: "history",
            label: "Revert settings",
            onClick: () => void revertSettings(),
            disabled: saving || !hasRevertableSettingsChanges,
          },
        ]}
      />

      <section className={`${styles.settingsPanel} ${isMeal ? styles.settingsPanelMeal : ""}`}>
        <label className={styles.field}>
          <span>Name</span>
          <input value={settings.name} onChange={(event) => setSettings((current) => ({ ...current, name: event.target.value }))} />
        </label>

        {isMeal ? (
          <label className={styles.field}>
            <span>People</span>
            <NumberOnlyInput min={1} value={settings.peopleCount} onValueChange={(value) => setSettings((current) => ({ ...current, peopleCount: value }))} />
          </label>
        ) : (
          <div className={styles.inlineFields}>
            <label className={styles.field}>
              <span>People</span>
              <NumberOnlyInput min={1} value={settings.peopleCount} onValueChange={(value) => setSettings((current) => ({ ...current, peopleCount: value }))} />
            </label>
            <label className={styles.field}>
              <span>Days</span>
              <NumberOnlyInput min={1} value={settings.numberOfDays} onValueChange={(value) => setSettings((current) => ({ ...current, numberOfDays: value }))} />
            </label>
          </div>
        )}

        {!isMeal && (
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
        )}

      </section>

      <section className={styles.plannerShell}>
        <div className={styles.dayColumn}>
          {isMeal ? (
            <section className={`${styles.dayCard} ${pickerOpen ? styles.mealCardActive : ""}`}>
              <h2>Meal Recipes</h2>
              {(plan.recipes || []).length === 0 ? (
                <p className={styles.emptyMeal}>No recipes yet</p>
              ) : (
                <div className={styles.scheduledRecipes}>
                  {(plan.recipes || []).map((recipe) => {
                    const recipeId = getRecipeId(recipe);
                    return (
                      <div key={recipeId} className={`${styles.scheduledRecipe} ${styles.scheduledRecipeWithImage}`}>
                        {recipe.image ? (
                          <img className={styles.scheduledRecipeImage} src={recipe.image} alt={recipe.title} />
                        ) : (
                          <span className={`material-symbols-outlined ${styles.scheduledRecipeImage}`}>restaurant</span>
                        )}
                        <Link href={`/recipes/${recipeId}`}>{recipe.title}</Link>
                        <button type="button" onClick={() => removeRecipeFromMeal(recipeId)} aria-label="Remove recipe">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button type="button" className={`${styles.mealActionButton} ${styles.mealFooterButton}`} onClick={openMealRecipePicker} aria-label="Add recipes to this meal">
                <span className="material-symbols-outlined">add</span>
                <span>Add</span>
              </button>
            </section>
          ) : (
            (plan.days || []).map((day) => (
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
                                  <button type="button" onClick={() => removeRecipeFromMeal(recipeId, day.dayNumber, meal.mealType)} aria-label="Remove recipe">
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
            ))
          )}
        </div>

        <button type="button" className={`${styles.panelScrim} ${pickerOpen ? styles.panelScrimOpen : ""}`} onClick={() => setPickerOpen(false)} aria-label="Close recipe search" />
        <aside className={`${styles.recipePanel} ${pickerOpen ? styles.recipePanelOpen : ""}`}>
          <div className={styles.recipePanelHeader}>
            <div>
              <p className={styles.kicker}>{isMeal ? "Build This Meal" : "Add Recipes"}</p>
              <h2>{isMeal ? "Choose recipes for the whole meal" : activeSlot ? `Day ${activeSlot.dayNumber} ${titleCaseMeal(activeSlot.mealType)}` : "Choose a meal"}</h2>
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

          <input className={styles.recipeSearch} value={recipeSearch} onChange={(event) => setRecipeSearch(event.target.value)} placeholder={isMeal ? `Search ${SOURCE_TABS.find((tab) => tab.id === recipeSource)?.label.toLowerCase()} recipes for this meal` : `Search ${SOURCE_TABS.find((tab) => tab.id === recipeSource)?.label.toLowerCase()}`} />

          <div className={styles.recipeResults}>
            {loadingRecipes && recipeSource === "website" ? (
              <p className={styles.loadingSmall}>Loading recipes...</p>
            ) : filteredSourceRecipes.length === 0 ? (
              <p className={styles.loadingSmall}>No recipes found</p>
            ) : (
              filteredSourceRecipes.slice(0, 80).map((recipe) => {
                const recipeId = getRecipeId(recipe);
                return (
                  <button key={recipeId} type="button" className={styles.recipeResult} onClick={() => addRecipeToActiveMeal(recipe)} disabled={saving || (!isMeal && !activeSlot)} aria-label={isMeal ? `Add ${recipe.title} to this meal` : `Add ${recipe.title} to ${activeSlot ? `Day ${activeSlot.dayNumber} ${titleCaseMeal(activeSlot.mealType)}` : "the selected meal"}`}>
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
          <div className={styles.ingredientsHeader}>
            <h2>Ingredient List</h2>
            <div className={styles.ingredientModeTabs} role="tablist" aria-label="Ingredient list mode">
              <button
                type="button"
                role="tab"
                aria-selected={ingredientViewMode === "combined"}
                className={ingredientViewMode === "combined" ? styles.ingredientModeTabActive : styles.ingredientModeTab}
                onClick={() => setIngredientViewMode("combined")}
              >
                Combined
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ingredientViewMode === "byRecipe"}
                className={ingredientViewMode === "byRecipe" ? styles.ingredientModeTabActive : styles.ingredientModeTab}
                onClick={() => setIngredientViewMode("byRecipe")}
              >
                By Recipe
              </button>
            </div>
          </div>

          {ingredientViewMode === "combined" ? (
            <div className={styles.ingredientList}>
              {ingredientList.map((ingredient) => (
                <div key={ingredient.name} className={styles.ingredientItem}>
                  <div className={styles.ingredientSummary}>
                    <strong>{ingredient.name}</strong>
                    <span className={styles.ingredientQuantity}>{ingredient.quantities.join(" + ") || "As needed"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.recipeIngredientGroups}>
              {ingredientsByRecipe.map((recipeGroup) => (
                <section key={recipeGroup.recipeId || recipeGroup.recipeTitle} className={styles.recipeIngredientGroup}>
                  <h3>{recipeGroup.recipeTitle}</h3>
                  <div className={styles.ingredientList}>
                    {recipeGroup.ingredients.map((ingredient, index) => (
                      <div key={`${recipeGroup.recipeId || recipeGroup.recipeTitle}-${ingredient.name}-${index}`} className={styles.ingredientItem}>
                        <div className={styles.ingredientSummary}>
                          <strong>{ingredient.name}</strong>
                          <span className={styles.ingredientQuantity}>{ingredient.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}