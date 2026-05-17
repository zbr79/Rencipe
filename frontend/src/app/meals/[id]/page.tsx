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
import { authFetch, getCurrentUser, getCurrentUserId, type AuthUser } from "../../utils/authSession";
import { filterRecipesForUserLanguage, isRecipeRelevantToUserLanguage, type RecipeLanguage } from "../../utils/recipeLanguage";
import { matchesTextSearch } from "../../utils/textSearch";
import { readRecentlyViewedRecipes, type RecentlyViewedRecipe } from "../../utils/recentlyViewedRecipes";
import styles from "./page.module.css";

type MealType = "breakfast" | "lunch" | "dinner";
type MealEntryKind = "meal";
type RecipeSource = "meal" | "recent" | "website" | "saved";
type IngredientViewMode = "combined" | "byRecipe";
type SettingsSaveState = "idle" | "saving" | "saved" | "error" | "blocked";
type DraftSaveState = "idle" | "saving" | "saved" | "error";

interface Ingredient {
  name: string;
  quantity: string;
}

interface Recipe {
  id: string;
  _id?: string;
  title: string;
  description: string;
  language?: RecipeLanguage;
  image?: string;
  mainIngredients?: Ingredient[];
  seasonings?: Ingredient[];
}

type MealRecipe = Recipe | null;

interface Person {
  name: string;
  modifier: number;
}

interface MealScheduleSlot {
  mealType: MealType;
  recipes: MealRecipe[];
}

interface MealScheduleDay {
  dayNumber: number;
  meals: MealScheduleSlot[];
}

interface Meal {
  _id: string;
  kind?: MealEntryKind;
  userId: string;
  name: string;
  people: Person[];
  numberOfDays?: number;
  mealTypes?: MealType[];
  totalMealsNeeded?: number;
  days?: MealScheduleDay[];
  recipes?: MealRecipe[];
  isPublic?: boolean;
  views?: number;
  createdAt: string;
  updatedAt: string;
}

interface MealDraft {
  _id: string;
  draftType?: "recipe" | "meal";
  name?: string;
  title?: string;
  people?: Person[];
  recipes?: Recipe[];
  isPublic?: boolean;
}

interface ActiveSlot {
  dayNumber: number;
  mealType: MealType;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_ENTRY_SOURCE_TABS: { id: RecipeSource; label: string }[] = [
  { id: "meal", label: "This Meal" },
  { id: "website", label: "All" },
  { id: "saved", label: "Saved" },
];

const MEAL_SOURCE_TABS: { id: RecipeSource; label: string }[] = [
  { id: "website", label: "All" },
  { id: "saved", label: "Saved" },
  { id: "recent", label: "Recent" },
];

function isAvailableRecipe(recipe: MealRecipe | undefined): recipe is Recipe {
  return Boolean(recipe && (recipe._id || recipe.id));
}

function getRecipeId(recipe: MealRecipe | undefined) {
  return recipe?._id || recipe?.id || "";
}

function filterMealRecipesForUserLanguage(recipes: MealRecipe[], user?: AuthUser | null) {
  return recipes.filter((recipe) => !recipe || isRecipeRelevantToUserLanguage(recipe, user));
}

function createEmptyMealDraft(userId: string): Meal {
  const timestamp = new Date().toISOString();

  return {
    _id: "new",
    kind: "meal",
    userId,
    name: "",
    people: [{ name: "Person 1", modifier: 1 }],
    recipes: [],
    days: [],
    isPublic: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  } as Meal;
}

function createMealFromDraft(draft: MealDraft, userId: string): Meal {
  const timestamp = new Date().toISOString();

  return {
    _id: "new",
    kind: "meal",
    userId,
    name: draft.title?.trim() || draft.name?.trim() || "",
    people: draft.people?.length ? draft.people : [{ name: "Person 1", modifier: 1 }],
    recipes: uniqueRecipes((draft.recipes || []) as Recipe[]),
    days: [],
    isPublic: Boolean(draft.isPublic),
    createdAt: timestamp,
    updatedAt: timestamp,
  } as Meal;
}

function titleCaseMeal(type: MealType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getMealEntryKind(meal?: { kind?: MealEntryKind }): MealEntryKind {
  return "meal";
}

function uniqueRecipes(recipes: MealRecipe[]) {
  const seen = new Set<string>();
  return recipes.filter((recipe) => {
    if (!recipe) return true;
    const id = getRecipeId(recipe);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function recentRecipeToRecipe(item: RecentlyViewedRecipe): Recipe {
  return {
    id: item.id,
    _id: item.id,
    title: item.title,
    description: item.description || "",
    language: item.language,
    image: item.image,
    mainIngredients: [],
    seasonings: [],
  };
}

function normalizeMealTypes(types?: MealType[]): MealType[] {
  const requestedTypes = new Set(types || []);
  const filtered = MEAL_TYPES.filter((type) => requestedTypes.has(type));
  return filtered.length > 0 ? filtered : ["dinner"];
}

function normalizeMeal(rawMeal: Meal, user?: AuthUser | null): Meal {
  const kind = getMealEntryKind(rawMeal);
  const inboxRecipes = filterMealRecipesForUserLanguage((rawMeal.recipes || []) as MealRecipe[], user);

  if (kind === "meal") {
    return {
      ...rawMeal,
      kind,
      people: rawMeal.people?.length ? rawMeal.people : [{ name: "Person 1", modifier: 1 }],
      recipes: uniqueRecipes(inboxRecipes),
      mealTypes: [],
      days: [],
      totalMealsNeeded: inboxRecipes.length,
    };
  }

  const mealTypes = normalizeMealTypes(rawMeal.mealTypes);
  const dayCount = Math.max(1, rawMeal.numberOfDays || rawMeal.days?.length || 1);
  const existingDays = rawMeal.days || [];

  const days = Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    const existingDay = existingDays.find((day) => day.dayNumber === dayNumber);

    return {
      dayNumber,
      meals: mealTypes.map((mealType) => {
        const existingMeal = existingDay?.meals?.find((meal) => meal.mealType === mealType);
        return {
          mealType,
          recipes: filterMealRecipesForUserLanguage((existingMeal?.recipes || []) as MealRecipe[], user),
        };
      }),
    };
  });

  return {
    ...rawMeal,
    kind,
    people: rawMeal.people?.length ? rawMeal.people : [{ name: "Person 1", modifier: 1 }],
    numberOfDays: dayCount,
    mealTypes,
    totalMealsNeeded: dayCount * mealTypes.length,
    days,
    recipes: inboxRecipes,
  };
}

function serializeDays(days: MealScheduleDay[]) {
  return days.map((day) => ({
    dayNumber: day.dayNumber,
    meals: day.meals.map((meal) => ({
      mealType: meal.mealType,
      recipes: meal.recipes.map(getRecipeId).filter(Boolean),
    })),
  }));
}

function serializeRecipes(recipes: MealRecipe[]) {
  return recipes.map(getRecipeId).filter(Boolean);
}

function getSettingsFromMeal(meal: Meal): {
  name: string;
  peopleCount: number;
  numberOfDays: number;
  mealTypes: MealType[];
  isPublic: boolean;
} {
  return {
    name: meal.name,
    peopleCount: meal.people.length,
    numberOfDays: meal.numberOfDays || 1,
    mealTypes: meal.mealTypes?.length ? normalizeMealTypes(meal.mealTypes) : ["dinner"],
    isPublic: Boolean(meal.isPublic),
  };
}

function getMealOwnerId(meal: Meal | null) {
  const owner = meal?.userId as any;
  return String(owner?._id || owner?.id || owner || "");
}

function getInitialSlot(meal: Meal): ActiveSlot | null {
  if (getMealEntryKind(meal) === "meal") return null;

  return {
    dayNumber: meal.days?.[0]?.dayNumber || 1,
    mealType: meal.mealTypes?.[0] || "dinner",
  };
}

function getSettingsSignature(
  settings: { name: string; peopleCount: number; numberOfDays: number; mealTypes: MealType[]; isPublic: boolean },
  entryKind: MealEntryKind
) {
  return JSON.stringify({
    name: settings.name.trim(),
    peopleCount: settings.peopleCount,
    isPublic: settings.isPublic,
  });
}

function getSettingsValidationMessage(
  settings: { name: string; peopleCount: number; numberOfDays: number; mealTypes: MealType[]; isPublic: boolean },
  entryKind: MealEntryKind
) {
  if (!settings.name.trim()) {
    return entryKind === "meal"
      ? "Autosave paused until the meal has a name."
      : "Autosave paused until the meal has a name.";
  }

  return null;
}

function getMealCompletionMessage(settings: { name: string; peopleCount: number }, recipes: MealRecipe[]) {
  if (!settings.name.trim()) {
    return "Add a meal name before creating this meal.";
  }

  if (settings.peopleCount < 1) {
    return "Add at least one person before creating this meal.";
  }

  if (!recipes.some(isAvailableRecipe)) {
    return "Add at least one recipe before creating this meal.";
  }

  return null;
}

function getMealDraftName(settings: { name: string }) {
  return settings.name.trim() || "Untitled Meal Draft";
}

export default function MealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { savedRecipes, fetchSaved, deleteMeal, isMealSaved, saveMeal, unsaveMeal } = useSaved();
  const { confirm, notify } = useConfirmDialog();
  const [mealId, setMealId] = useState("");
  const [meal, setMeal] = useState<Meal | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recipeSource, setRecipeSource] = useState<RecipeSource>("website");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [ingredientViewMode, setIngredientViewMode] = useState<IngredientViewMode>("combined");
  const [mealEditMode, setMealEditMode] = useState(false);
  const [settings, setSettings] = useState({
    name: "",
    peopleCount: 1,
    numberOfDays: 1,
    mealTypes: ["dinner"] as MealType[],
    isPublic: false,
  });
  const [revertSettingsSnapshot, setRevertSettingsSnapshot] = useState<ReturnType<typeof getSettingsFromMeal> | null>(null);
  const [settingsSaveState, setSettingsSaveState] = useState<SettingsSaveState>("idle");
  const [settingsSaveMessage, setSettingsSaveMessage] = useState("");
  const [mealDraftId, setMealDraftId] = useState<string | null>(null);
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const [draftSaveMessage, setDraftSaveMessage] = useState("");
  const settingsAutosaveTimerRef = useRef<number | null>(null);
  const mealDraftAutosaveTimerRef = useRef<number | null>(null);
  const lastSavedSettingsSignatureRef = useRef("");
  const lastSavedMealDraftSignatureRef = useRef("");

  useEffect(() => {
    params.then((value) => setMealId(value.id));
    setCurrentUser(getCurrentUser());
  }, [params]);

  useEffect(() => {
    fetchSaved();

  }, []);

  useEffect(() => {
    if (!mealId) return;

    async function fetchMeal() {
      setLoading(true);
      setError("");
      try {
        const activeUser = getCurrentUser();
        setCurrentUser(activeUser);

        if (mealId === "new") {
          const activeUserId = activeUser?.id || getCurrentUserId();
          let draftMeal = createEmptyMealDraft(activeUserId);
          let loadedDraftId: string | null = null;

          if (typeof window !== "undefined" && activeUserId) {
            const draftId = new URLSearchParams(window.location.search).get("draftId");
            if (draftId) {
              const draftResponse = await fetch(`/api/drafts?authorId=${activeUserId}&id=${draftId}`);
              if (draftResponse.ok) {
                const draftData = await draftResponse.json();
                if (draftData.draft?.draftType === "meal") {
                  draftMeal = createMealFromDraft(draftData.draft, activeUserId);
                  loadedDraftId = draftData.draft._id;
                }
              }
            }
          }

          const initialSettings = getSettingsFromMeal(draftMeal);
          const shouldAutoEdit = typeof window !== "undefined" && window.location.hash === "#edit";
          setMeal(draftMeal);
          setMealDraftId(loadedDraftId);
          setSettings(initialSettings);
          setRevertSettingsSnapshot(initialSettings);
          lastSavedSettingsSignatureRef.current = getSettingsSignature(initialSettings, "meal");
          lastSavedMealDraftSignatureRef.current = getMealDraftSignature(initialSettings, draftMeal.recipes || []);
          setSettingsSaveState("blocked");
          setSettingsSaveMessage("Saved as draft until required fields are complete.");
          setDraftSaveState("idle");
          setDraftSaveMessage("");
          setActiveSlot(null);
          setMealEditMode(true);

          if (typeof window !== "undefined" && window.location.hash) {
            const nextPath = loadedDraftId ? `/meals/new?draftId=${loadedDraftId}` : "/meals/new";
            window.history.replaceState(window.history.state, "", nextPath);
          }
          return;
        }

        const response = await authFetch(`/api/meals/${mealId}`);
        if (!response.ok) throw new Error("Failed to fetch meal");
        const data = await response.json();
        setCurrentUser(activeUser);
        const normalizedMeal = normalizeMeal(data.meal, activeUser);
        const initialSettings = getSettingsFromMeal(normalizedMeal);
        const shouldAutoEdit = typeof window !== "undefined"
          && getMealEntryKind(normalizedMeal) === "meal"
          && window.location.hash === "#edit";
        setMeal(normalizedMeal);
        setSettings(initialSettings);
        setRevertSettingsSnapshot(initialSettings);
        lastSavedSettingsSignatureRef.current = getSettingsSignature(initialSettings, getMealEntryKind(normalizedMeal));
        setSettingsSaveState("saved");
        setSettingsSaveMessage("All changes saved.");
        setActiveSlot(getInitialSlot(normalizedMeal));
        setMealEditMode(shouldAutoEdit);

        if (shouldAutoEdit) {
          window.history.replaceState(window.history.state, "", `/meals/${normalizedMeal._id}`);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load meal");
      } finally {
        setLoading(false);
      }
    }

    fetchMeal();
  }, [mealId]);

  function getMealDraftSignature(nextSettings: typeof settings, recipes: MealRecipe[]) {
    return JSON.stringify({
      name: nextSettings.name.trim(),
      peopleCount: nextSettings.peopleCount,
      isPublic: nextSettings.isPublic,
      recipes: recipes.map(getRecipeId).filter(Boolean),
    });
  }

  function getMealDraftPayload(nextSettings: typeof settings, recipes: MealRecipe[]) {
    const people = Array.from({ length: nextSettings.peopleCount }, (_, index) => ({
      name: meal?.people[index]?.name || `Person ${index + 1}`,
      modifier: 1,
    }));

    return {
      draftType: "meal",
      authorId: currentUser?.id || getCurrentUserId(),
      name: getMealDraftName(nextSettings),
      title: nextSettings.name.trim(),
      description: "",
      isPublic: nextSettings.isPublic,
      people,
      recipes: recipes.map(getRecipeId).filter(Boolean),
      steps: [],
      servings: Math.max(1, nextSettings.peopleCount),
      tags: [],
    };
  }

  async function saveMealDraft(nextSettings: typeof settings, recipes: MealRecipe[]) {
    const authorId = currentUser?.id || getCurrentUserId();
    if (!authorId) {
      setDraftSaveState("error");
      setDraftSaveMessage("Sign in before saving this meal draft.");
      return null;
    }

    setDraftSaveState("saving");
    setDraftSaveMessage("Saving draft...");

    try {
      const payload = getMealDraftPayload(nextSettings, recipes);
      const response = await fetch("/api/drafts", {
        method: mealDraftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealDraftId ? { ...payload, id: mealDraftId } : payload),
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => null);
        throw new Error(responseError?.error || "Failed to save meal draft");
      }

      const data = await response.json();
      const savedDraft: MealDraft | null = data.draft || null;
      if (savedDraft?._id) {
        setMealDraftId(savedDraft._id);
        if (typeof window !== "undefined" && !new URLSearchParams(window.location.search).get("draftId")) {
          window.history.replaceState(window.history.state, "", `/meals/new?draftId=${savedDraft._id}`);
        }
      }
      lastSavedMealDraftSignatureRef.current = getMealDraftSignature(nextSettings, recipes);
      setDraftSaveState("saved");
      setDraftSaveMessage("Draft saved.");
      return savedDraft;
    } catch (err: any) {
      setDraftSaveState("error");
      setDraftSaveMessage(err.message || "Could not save meal draft.");
      toastError(err.message || "Could not save meal draft");
      return null;
    }
  }

  async function submitMealDraft() {
    if (!meal || !currentUser) return;

    const recipes = uniqueRecipes(meal.recipes || []);
    const completionMessage = getMealCompletionMessage(settings, recipes);
    if (completionMessage) {
      setSettingsSaveState("blocked");
      setSettingsSaveMessage("Saved as draft until required fields are complete.");
      toastError(completionMessage);
      return;
    }

    setSaving(true);
    setSettingsSaveState("saving");
    setSettingsSaveMessage("Creating meal...");

    try {
      const people = Array.from({ length: settings.peopleCount }, (_, index) => ({
        name: meal.people[index]?.name || `Person ${index + 1}`,
        modifier: 1,
      }));

      const response = await authFetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          kind: "meal",
          numberOfPeople: settings.peopleCount,
          name: settings.name.trim(),
          people,
          recipes: recipes.map(getRecipeId).filter(Boolean),
          isPublic: settings.isPublic,
        }),
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => null);
        throw new Error(responseError?.error || "Failed to create meal");
      }

      const data = await response.json();
      const normalizedMeal = normalizeMeal(data.meal, currentUser);
      if (mealDraftId) {
        await fetch(`/api/drafts?authorId=${currentUser.id}&id=${mealDraftId}`, { method: "DELETE" }).catch(() => null);
      }

      const normalizedSettings = getSettingsFromMeal(normalizedMeal);
      setMeal(normalizedMeal);
      setMealId(normalizedMeal._id);
      setMealDraftId(null);
      setSettings(normalizedSettings);
      setRevertSettingsSnapshot(normalizedSettings);
      lastSavedSettingsSignatureRef.current = getSettingsSignature(normalizedSettings, "meal");
      setSettingsSaveState("saved");
      setSettingsSaveMessage("Meal created.");
      setDraftSaveState("idle");
      setDraftSaveMessage("");
      toastSuccess("Meal created successfully.");
      window.history.replaceState(window.history.state, "", `/meals/${normalizedMeal._id}`);
    } catch (err: any) {
      const nextMessage = err.message || "Could not create meal.";
      setSettingsSaveState("error");
      setSettingsSaveMessage(nextMessage);
      toastError(nextMessage);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    setRecentRecipes(readRecentlyViewedRecipes().map(recentRecipeToRecipe));
  }, [pickerOpen]);

  useEffect(() => {
    if (meal && getMealEntryKind(meal) === "meal" && recipeSource === "meal") {
      setRecipeSource("website");
    }
  }, [meal, recipeSource]);

  useEffect(() => {
    async function fetchRecipes() {
      setLoadingRecipes(true);
      try {
        const response = await authFetch("/api/recipes?limit=1000");
        if (!response.ok) throw new Error("Failed to fetch recipes");
        const data = await response.json();
        setAllRecipes((data.recipes || []) as Recipe[]);
      } catch (err) {
        console.error("Failed to load recipe library", err);
      } finally {
        setLoadingRecipes(false);
      }
    }

    fetchRecipes();
  }, []);

  const recipesInMeal = useMemo(() => {
    if (!meal) return [];
    if (getMealEntryKind(meal) === "meal") {
      return uniqueRecipes(meal.recipes || []);
    }
    const scheduledRecipes = (meal.days || []).flatMap((day) => day.meals.flatMap((meal) => meal.recipes));
    return uniqueRecipes([...scheduledRecipes, ...(meal.recipes || [])]);
  }, [meal]);

  const availableRecipesInMeal = useMemo(() => recipesInMeal.filter(isAvailableRecipe), [recipesInMeal]);

  const ingredientList = useMemo(() => {
    const ingredients = new Map<string, { name: string; quantities: string[]; sources: string[] }>();

    availableRecipesInMeal.forEach((recipe) => {
      [...(recipe.mainIngredients || []), ...(recipe.seasonings || [])].forEach((ingredient) => {
        const key = ingredient.name.toLowerCase();
        const current = ingredients.get(key) || { name: ingredient.name, quantities: [], sources: [] };
        if (ingredient.quantity) current.quantities.push(ingredient.quantity);
        if (!current.sources.includes(recipe.title)) current.sources.push(recipe.title);
        ingredients.set(key, current);
      });
    });

    return Array.from(ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableRecipesInMeal]);

  const ingredientsByRecipe = useMemo(() => {
    return availableRecipesInMeal
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
  }, [availableRecipesInMeal]);

  const canEditMeal = Boolean(meal && currentUser && (currentUser.role === "admin" || getMealOwnerId(meal) === currentUser.id));
  const isMealEntry = getMealEntryKind(meal || undefined) === "meal";
  const canEditCurrentView = canEditMeal && (!isMealEntry || mealEditMode);

  const sourceRecipes = useMemo(() => {
    if (recipeSource === "meal") return availableRecipesInMeal;
    if (recipeSource === "recent") return recentRecipes;
    if (recipeSource === "saved") return savedRecipes as Recipe[];
    return allRecipes;
  }, [allRecipes, availableRecipesInMeal, recentRecipes, recipeSource, savedRecipes]);

  const filteredSourceRecipes = useMemo(() => {
    const query = recipeSearch.trim();
    if (!query) return sourceRecipes;
    return sourceRecipes.filter((recipe) => matchesTextSearch(query, recipe.title, recipe.description));
  }, [recipeSearch, sourceRecipes]);

  async function saveMealChanges(nextMeal: Meal, successMessage?: string) {
    if (nextMeal._id === "new") {
      setMeal(nextMeal);
      if (successMessage) toastSuccess(successMessage);
      return true;
    }

    setSaving(true);
    try {
      const body = getMealEntryKind(nextMeal) === "meal"
        ? { recipes: serializeRecipes(nextMeal.recipes || []) }
        : { days: serializeDays(nextMeal.days || []) };

      const response = await authFetch(`/api/meals/${nextMeal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update meal");
      const data = await response.json();
      const normalizedMeal = normalizeMeal(data.meal, currentUser);
      setMeal(normalizedMeal);
      if (getMealEntryKind(normalizedMeal) === "meal") {
        setActiveSlot(null);
      }
      if (successMessage) toastSuccess(successMessage);
      return true;
    } catch (err: any) {
      toastError(err.message || "Could not update meal");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCurrentMeal() {
    if (!meal || !canEditCurrentView) return;

    const entryKind = getMealEntryKind(meal);
    const itemName = "meal";
    const approved = await confirm({
      title: "Delete meal",
      message: `Move this ${itemName} to Trash for 7 days?`,
      intent: "danger",
      confirmText: "Delete",
    });

    if (!approved) return;

    try {
      await deleteMeal(meal._id);
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
    if (!meal || !canEditCurrentView) return false;

    const entryKind = getMealEntryKind(meal);
    const people = Array.from({ length: nextSettings.peopleCount }, (_, index) => ({
      name: meal.people[index]?.name || `Person ${index + 1}`,
      modifier: 1,
    }));

    setSaving(true);
    try {
      const response = await authFetch(`/api/meals/${meal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          entryKind === "meal"
            ? {
                name: nextSettings.name.trim(),
                people,
                isPublic: nextSettings.isPublic,
              }
            : {
                name: nextSettings.name.trim(),
                people,
                numberOfDays: nextSettings.numberOfDays,
                mealTypes: nextSettings.mealTypes,
                days: normalizeMeal({
                    ...meal,
                    name: nextSettings.name.trim(),
                    people,
                    numberOfDays: nextSettings.numberOfDays,
                    mealTypes: nextSettings.mealTypes,
                  }, currentUser).days?.map((day) => ({
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
        throw new Error(entryKind === "meal" ? "Failed to save meal settings" : "Failed to save meal settings");
      }

      const data = await response.json();
      const normalizedMeal = normalizeMeal(data.meal, currentUser);
      const normalizedSettings = getSettingsFromMeal(normalizedMeal);
      setMeal(normalizedMeal);
      setSettings(normalizedSettings);
      lastSavedSettingsSignatureRef.current = getSettingsSignature(normalizedSettings, getMealEntryKind(normalizedMeal));
      setSettingsSaveState("saved");
      setSettingsSaveMessage(options?.statusMessage || "All changes saved.");
      setActiveSlot((current) => {
        if (getMealEntryKind(normalizedMeal) === "meal") {
          return null;
        }

        if (
          current
          && normalizedMeal.days?.some((day) => day.dayNumber === current.dayNumber)
          && normalizedMeal.mealTypes?.includes(current.mealType)
        ) {
          return current;
        }

        return getInitialSlot(normalizedMeal);
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

  async function handleMealPublicChange(checked: boolean) {
    if (!canEditCurrentView) return;

    if (checked && !settings.isPublic) {
      const approved = await confirm({
        title: "Publish meal",
        message: "This will make everyone see this meal. Are you sure?",
        intent: "warning",
        confirmText: "Publish",
      });

      if (!approved) {
        return;
      }
    }

    setSettings((current) => ({ ...current, isPublic: checked }));
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
    if (!canEditCurrentView) return;
    setActiveSlot({ dayNumber, mealType });
    setPickerOpen(true);
  }

  function openMealRecipePicker() {
    if (!canEditCurrentView) return;
    setActiveSlot(null);
    setPickerOpen(true);
  }

  useEffect(() => {
    return () => {
      if (settingsAutosaveTimerRef.current) {
        window.clearTimeout(settingsAutosaveTimerRef.current);
      }
      if (mealDraftAutosaveTimerRef.current) {
        window.clearTimeout(mealDraftAutosaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!meal || meal._id !== "new" || !canEditCurrentView || loading || saving) {
      return;
    }

    const recipes = uniqueRecipes(meal.recipes || []);
    const nextSignature = getMealDraftSignature(settings, recipes);
    if (nextSignature === lastSavedMealDraftSignatureRef.current) {
      return;
    }

    const completionMessage = getMealCompletionMessage(settings, recipes);
    setSettingsSaveState(completionMessage ? "blocked" : "saving");
    setSettingsSaveMessage(completionMessage ? "Saved as draft until required fields are complete." : "Creating meal...");

    const timeoutId = window.setTimeout(() => {
      if (completionMessage) {
        void saveMealDraft(settings, recipes);
        return;
      }

      void submitMealDraft();
    }, 800);

    mealDraftAutosaveTimerRef.current = timeoutId;

    return () => {
      window.clearTimeout(timeoutId);
      if (mealDraftAutosaveTimerRef.current === timeoutId) {
        mealDraftAutosaveTimerRef.current = null;
      }
    };
  }, [canEditCurrentView, loading, meal, saving, settings]);

  useEffect(() => {
    if (!meal || meal._id === "new" || !canEditCurrentView || loading || saving) {
      return;
    }

    const entryKind = getMealEntryKind(meal);
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
  }, [canEditCurrentView, loading, meal, saving, settings, settingsSaveState]);

  async function revertSettings() {
    if (!revertSettingsSnapshot || !canEditCurrentView) return;

    if (saving) {
      toastError("Wait for the current changes to finish saving.");
      return;
    }

    const reverted = await persistSettings(revertSettingsSnapshot, {
      successMessage: "Reverted meal settings",
      statusMessage: "Original version restored.",
      errorMessage: "Could not revert settings.",
    });

    if (reverted) {
      setSettings(revertSettingsSnapshot);
    }
  }

  async function addRecipeToActiveMeal(recipe: Recipe) {
    if (!meal || !canEditCurrentView) return;
    const recipeId = getRecipeId(recipe);

    if (getMealEntryKind(meal) === "meal") {
      if ((meal.recipes || []).some((item) => getRecipeId(item) === recipeId)) return;

      const nextMeal = {
        ...meal,
        recipes: [...(meal.recipes || []), recipe],
      };

      const saved = await saveMealChanges(nextMeal);
      if (saved) setPickerOpen(false);
      return;
    }

    if (!activeSlot) return;
    const nextMeal = {
      ...meal,
      days: (meal.days || []).map((day) => {
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

    const saved = await saveMealChanges(nextMeal);
    if (saved) setPickerOpen(false);
  }

  async function removeRecipeFromMeal(recipeId: string, dayNumber?: number, mealType?: MealType) {
    if (!meal || !canEditCurrentView) return;

    if (getMealEntryKind(meal) === "meal") {
      const nextMeal = {
        ...meal,
        recipes: (meal.recipes || []).filter((recipe) => getRecipeId(recipe) !== recipeId),
      };

      await saveMealChanges(nextMeal, "Recipe removed");
      return;
    }

    const nextMeal = {
      ...meal,
      days: (meal.days || []).map((day) => {
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

    await saveMealChanges(nextMeal, "Recipe removed");
  }

  if (loading) {
    return <main className={styles.page}><p className={styles.loading}>Loading...</p></main>;
  }

  if (error || !meal) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <p>{error || "Meal not found"}</p>
          <BackButton fallbackHref="/meals" className={styles.primaryLink} label="Back to Meals" />
        </div>
      </main>
    );
  }

  const isMeal = isMealEntry;
  const mealSaved = isMeal ? isMealSaved(meal._id) : false;
  const sourceTabs = isMeal ? MEAL_SOURCE_TABS : MEAL_ENTRY_SOURCE_TABS;
  const sourceLabel = sourceTabs.find((tab) => tab.id === recipeSource)?.label.toLowerCase() || "website";
  const hasRevertableSettingsChanges = revertSettingsSnapshot
    ? getSettingsSignature(settings, "meal") !== getSettingsSignature(revertSettingsSnapshot, "meal")
    : false;
  const statusMessage = meal._id === "new" ? (draftSaveMessage || settingsSaveMessage) : settingsSaveMessage;
  const statusState = meal._id === "new" && draftSaveState === "error" ? "error" : settingsSaveState;

  return (
    <main className={styles.page}>
      {canEditCurrentView && statusMessage && (
        <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 1000 }}>
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              color: statusState === "error" ? "var(--error)" : "var(--text-secondary)",
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${statusState === "error" ? "color-mix(in srgb, var(--error) 40%, var(--border))" : "var(--border)"}`,
              fontSize: "12px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {statusMessage}
          </div>
        </div>
      )}

      <header className={styles.header}>
        <BackButton fallbackHref="/" className={styles.backLink} />
        <div>
          {!isMeal && <p className={styles.kicker}>Meal</p>}
          <h1>{meal.name}</h1>
        </div>
      </header>

      <FloatingActionPanel
        ariaLabel="Meal actions"
        actions={[
          ...(isMeal
            ? [
                {
                  id: "save",
                  icon: mealSaved ? "favorite" : "favorite_border",
                  label: mealSaved ? "Remove from saved" : "Save meal",
                  onClick: async () => {
                    setIsSavingMeal(true);
                    try {
                      if (mealSaved) {
                        await unsaveMeal(undefined, meal._id);
                      } else {
                        await saveMeal(undefined, meal._id);
                      }
                    } finally {
                      setIsSavingMeal(false);
                    }
                  },
                  disabled: isSavingMeal,
                  tone: "primary" as const,
                },
              ]
            : []),
          ...(canEditMeal && isMeal && !mealEditMode
            ? [
                {
                  id: "edit",
                  icon: "edit",
                  label: "Edit meal",
                  onClick: () => setMealEditMode(true),
                  tone: "primary" as const,
                },
              ]
            : []),
          ...(canEditCurrentView
            ? [
                {
                  id: "delete",
                  icon: "delete",
                  label: isMeal ? "Delete meal" : "Delete meal",
                  onClick: () => void handleDeleteCurrentMeal(),
                  disabled: saving,
                  tone: "danger" as const,
                },
                {
                  id: "revert",
                  icon: "history",
                  label: "Revert settings",
                  onClick: () => void revertSettings(),
                  disabled: saving || !hasRevertableSettingsChanges,
                },
              ]
            : []),
        ]}
      />

      {canEditCurrentView && (
        <section className={`${styles.settingsPanel} ${isMeal ? styles.settingsPanelMeal : ""}`}>
          <label className={styles.field}>
            <span>Name</span>
            <input value={settings.name} onChange={(event) => setSettings((current) => ({ ...current, name: event.target.value }))} />
          </label>

          {isMeal ? (
            <>
              <label className={styles.field}>
                <span>People</span>
                <NumberOnlyInput min={1} value={settings.peopleCount} onValueChange={(value) => setSettings((current) => ({ ...current, peopleCount: value }))} />
              </label>
              <label className={`${styles.mealTypeOption} ${styles.publicToggle}`}>
                <input type="checkbox" checked={settings.isPublic} onChange={(event) => void handleMealPublicChange(event.target.checked)} />
                <span>Public</span>
              </label>
            </>
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
      )}

      <section className={styles.mealEditorShell}>
        <div className={styles.dayColumn}>
          {isMeal ? (
            <section className={`${styles.dayCard} ${pickerOpen ? styles.mealCardActive : ""}`}>
              <h2>Meal Recipes</h2>
              {(meal.recipes || []).length > 0 && (
                <div className={styles.scheduledRecipes}>
                  {(meal.recipes || []).map((recipe, index) => {
                    const recipeId = getRecipeId(recipe);
                    const recipeAvailable = isAvailableRecipe(recipe);
                    const readOnlyRecipe = !canEditCurrentView || !recipeId;
                    return (
                      <div key={recipeId || `deleted-recipe-${index}`} className={`${styles.scheduledRecipe} ${styles.scheduledRecipeWithImage} ${readOnlyRecipe ? styles.scheduledRecipeReadOnly : ""} ${!recipeAvailable ? styles.scheduledRecipeDeleted : ""}`}>
                        {recipeAvailable && recipe.image ? (
                          <img className={styles.scheduledRecipeImage} src={recipe.image} alt={recipe.title} />
                        ) : (
                          <span className={`material-symbols-outlined ${styles.scheduledRecipeImage}`}>{recipeAvailable ? "restaurant" : "no_food"}</span>
                        )}
                        {recipeAvailable ? (
                          <Link href={`/recipes/${recipeId}`}>{recipe.title}</Link>
                        ) : (
                          <span className={styles.deletedRecipeLabel}>Recipe deleted</span>
                        )}
                        {canEditCurrentView && recipeId && (
                          <button type="button" onClick={() => removeRecipeFromMeal(recipeId)} aria-label="Remove recipe">
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {canEditCurrentView && (
                <button type="button" className={`${styles.mealActionButton} ${styles.mealFooterButton}`} onClick={openMealRecipePicker} aria-label="Add recipes to this meal">
                  <span className="material-symbols-outlined">add</span>
                  <span>Add</span>
                </button>
              )}
            </section>
          ) : (
            (meal.days || []).map((day) => (
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
                          {canEditCurrentView && (
                            <button type="button" onClick={() => openRecipePicker(day.dayNumber, meal.mealType)} aria-label={`Add recipe to Day ${day.dayNumber} ${titleCaseMeal(meal.mealType)}`}>
                              <span className="material-symbols-outlined">add</span>
                            </button>
                          )}
                        </div>

                        {meal.recipes.length === 0 ? (
                          <p className={styles.emptyMeal}>No recipes yet</p>
                        ) : (
                          <div className={styles.scheduledRecipes}>
                            {meal.recipes.map((recipe, index) => {
                              const recipeId = getRecipeId(recipe);
                              const recipeAvailable = isAvailableRecipe(recipe);
                              const readOnlyRecipe = !canEditCurrentView || !recipeId;
                              return (
                                <div key={recipeId || `deleted-recipe-${index}`} className={`${styles.scheduledRecipe} ${readOnlyRecipe ? styles.scheduledRecipeReadOnly : ""} ${!recipeAvailable ? styles.scheduledRecipeDeleted : ""}`}>
                                  {recipeAvailable ? (
                                    <Link href={`/recipes/${recipeId}`}>{recipe.title}</Link>
                                  ) : (
                                    <span className={styles.deletedRecipeLabel}>Recipe deleted</span>
                                  )}
                                  {canEditCurrentView && recipeId && (
                                    <button type="button" onClick={() => removeRecipeFromMeal(recipeId, day.dayNumber, meal.mealType)} aria-label="Remove recipe">
                                      <span className="material-symbols-outlined">close</span>
                                    </button>
                                  )}
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
              {!isMeal && <p className={styles.kicker}>Add Recipes</p>}
              <h2>{isMeal ? "Add a recipe" : activeSlot ? `Day ${activeSlot.dayNumber} ${titleCaseMeal(activeSlot.mealType)}` : "Choose a meal"}</h2>
            </div>
            <button type="button" className={styles.closePickerButton} onClick={() => setPickerOpen(false)} aria-label="Close recipe search">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className={styles.sourceTabs}>
            {sourceTabs.map((tab) => (
              <button key={tab.id} type="button" className={recipeSource === tab.id ? styles.sourceTabActive : ""} onClick={() => setRecipeSource(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          <input className={styles.recipeSearch} value={recipeSearch} onChange={(event) => setRecipeSearch(event.target.value)} placeholder={isMeal ? `Search ${sourceLabel} recipes for this meal` : `Search ${sourceLabel}`} />

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