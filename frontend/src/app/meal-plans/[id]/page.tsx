"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../../contexts/SavedContext";
import styles from "../../recipes/page.module.css";
import RecipeSelectionModal from "./components/RecipeSelectionModal";
import { enrichRecipesWithMockImages } from "../../utils/recipeImageUtils";
import { authFetch } from "../../utils/authSession";

interface Recipe {
  id: string;
  _id?: string;
  title: string;
  description: string;
  image?: string;
  component: boolean;
  mainIngredients: Array<{ name: string; quantity: string }>;
  seasonings: Array<{ name: string; quantity: string }>;
}

interface Person {
  name: string;
  modifier: number;
}

interface MealCombination {
  meatRecipeId: Recipe;
  vegeRecipeId: Recipe;
  sideRecipeId: Recipe;
  portions: number;
}

interface MealPlan {
  _id: string;
  userId: string;
  name: string;
  people: Person[];
  numberOfDays: number;
  mealTypes: ('lunch' | 'dinner')[];
  totalMealsNeeded: number;
  recipes?: Recipe[];
  combinations: MealCombination[];
  checkedIngredients: string[];
  createdAt: string;
  updatedAt: string;
}

interface AggregatedIngredient {
  name: string;
  quantity: string;
  sources: string[]; // Which recipes this came from
}

export default function MealPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { addMealCombination, removeMealCombination, renameMealPlan } = useSaved();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  // Add combination form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedMeat, setSelectedMeat] = useState<string>("");
  const [selectedVege, setSelectedVege] = useState<string>("");
  const [selectedSide, setSelectedSide] = useState<string>("");
  const [portions, setPortions] = useState<number | "">(1);
  const [addingCombination, setAddingCombination] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Recipe selection modal state
  const [meatModalOpen, setMeatModalOpen] = useState(false);
  const [vegeModalOpen, setVegeModalOpen] = useState(false);
  const [sideModalOpen, setSideModalOpen] = useState(false);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  
  // Edit plan details modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPeople, setEditPeople] = useState<Person[]>([]);
  const [editDays, setEditDays] = useState<number | "">(0);
  const [editMealTypes, setEditMealTypes] = useState<('lunch' | 'dinner')[]>([]);
  const [editTotalMeals, setEditTotalMeals] = useState(0);
  
  // Edit combination modal state
  const [editComboModalOpen, setEditComboModalOpen] = useState(false);
  const [editComboIndex, setEditComboIndex] = useState<number | null>(null);
  const [editComboMeat, setEditComboMeat] = useState("");
  const [editComboVege, setEditComboVege] = useState("");
  const [editComboSide, setEditComboSide] = useState("");
  const [editComboPortions, setEditComboPortions] = useState<number | "">(1);
  const [editComboModifier, setEditComboModifier] = useState(1.0);


  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/meal-plans/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch meal plan");
        }
        const data = await response.json();
        
        // Enrich recipes in combinations with mock images
        if (data.plan.combinations) {
          data.plan.combinations.forEach((combo: any) => {
            if (combo.meatRecipeId) {
              combo.meatRecipeId = enrichRecipesWithMockImages([combo.meatRecipeId])[0];
            }
            if (combo.vegeRecipeId) {
              combo.vegeRecipeId = enrichRecipesWithMockImages([combo.vegeRecipeId])[0];
            }
            if (combo.sideRecipeId) {
              combo.sideRecipeId = enrichRecipesWithMockImages([combo.sideRecipeId])[0];
            }
          });
        }

        if (data.plan.recipes) {
          data.plan.recipes = enrichRecipesWithMockImages<Recipe>(data.plan.recipes);
        }
        
        setPlan(data.plan);
        setNewName(data.plan.name);
      } catch (err: any) {
        console.error("Error fetching meal plan:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  const fetchAllRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const response = await authFetch(`/api/recipes`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.recipes?.length || 0} recipes from backend`);
        
        // Only show component recipes
        const recipesToUse = ((data.recipes || []) as Recipe[]).filter((recipe) => recipe.component === true);
        console.log(`Filtered to ${recipesToUse.length} component recipes`);
        
        // Enrich with mock images
        const enrichedRecipes = enrichRecipesWithMockImages<Recipe>(recipesToUse);
        console.log(`After enrichment: ${enrichedRecipes.length} recipes`);
        setAllRecipes(enrichedRecipes);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleShowAddForm = async () => {
    setShowAddForm(true);
    // Always fetch recipes when opening form
    await fetchAllRecipes();
  };

  const handleAddCombination = async () => {
    // Validate portions
    const portionsNum = portions === "" ? 0 : parseInt(String(portions));
    
    if (!selectedMeat || !selectedVege || !selectedSide || isNaN(portionsNum) || portionsNum < 1) {
      setAddError("Complete all fields; portions must be greater than 0");
      return;
    }

    if (!plan) return;

    setAddingCombination(true);
    setAddError(null);

    try {
      const updatedPlan = await addMealCombination(
        plan._id,
        selectedMeat,
        selectedVege,
        selectedSide,
        portionsNum
      );

      // Enrich recipes in new combination with mock images
      if (updatedPlan.combinations && updatedPlan.combinations.length > 0) {
        const lastCombo = updatedPlan.combinations[updatedPlan.combinations.length - 1];
        if (lastCombo.meatRecipeId) {
          lastCombo.meatRecipeId = enrichRecipesWithMockImages([lastCombo.meatRecipeId])[0];
        }
        if (lastCombo.vegeRecipeId) {
          lastCombo.vegeRecipeId = enrichRecipesWithMockImages([lastCombo.vegeRecipeId])[0];
        }
        if (lastCombo.sideRecipeId) {
          lastCombo.sideRecipeId = enrichRecipesWithMockImages([lastCombo.sideRecipeId])[0];
        }
      }

      setPlan(updatedPlan);
      setShowAddForm(false);
      // Close all modals
      setMeatModalOpen(false);
      setVegeModalOpen(false);
      setSideModalOpen(false);
      // Reset form
      setSelectedMeat("");
      setSelectedVege("");
      setSelectedSide("");
      setPortions(1);
    } catch (err: any) {
      console.error("Error adding combination:", err);
      setAddError(err.message);
    } finally {
      setAddingCombination(false);
    }
  };

  const handleRemoveCombination = async (index: number) => {
    if (!plan) return;

    try {
      const updatedPlan = await removeMealCombination(plan._id, index);
      setPlan(updatedPlan);
    } catch (error) {
      console.error("Failed to remove combination:", error);
    }
  };

  const handleRenamePlan = async () => {
    if (!newName.trim() || !plan) return;

    try {
      const updatedPlan = await renameMealPlan(plan._id, newName);
      setPlan(updatedPlan);
      setIsRenaming(false);
    } catch (error) {
      console.error("Failed to rename plan:", error);
    }
  };

  const handleUpdatePlanDetails = async () => {
    if (!plan) return;

    try {
      const response = await fetch(`/api/meal-plans/${plan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numberOfPeople: editPeople,
          numberOfDays: editDays,
          mealTypes: editMealTypes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to update plan details:", error);
    }
  };

  const handleSaveAllChanges = async () => {
    if (!plan) return;

    // Validate inputs
    if (!Array.isArray(editPeople) || editPeople.length === 0) {
      alert("Add at least one person");
      return;
    }
    const days = editDays === "" ? plan.numberOfDays : parseInt(String(editDays));

    if (isNaN(days) || days < 1) {
      alert("Days must be a number greater than 0");
      return;
    }

    // Validate people have names and modifiers
    for (const person of editPeople) {
      if (!person.name || !person.modifier || person.modifier < 0.1 || person.modifier > 5.0) {
        alert("Each person needs a name and valid modifier (0.1-5.0)");
        return;
      }
    }

    try {
      const updateBody: any = {
        people: editPeople,
        numberOfDays: days,
        mealTypes: editMealTypes,
      };

      // Only include name if it changed
      if (newName.trim() && newName !== plan.name) {
        updateBody.name = newName;
      }

      const response = await fetch(`/api/meal-plans/${plan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to save plan changes:", error);
    }
  };

  const openEditModal = () => {
    if (plan) {
      setEditPeople([...plan.people]);
      setEditDays(plan.numberOfDays);
      setEditMealTypes(plan.mealTypes);
      setEditTotalMeals(plan.totalMealsNeeded);
      setEditModalOpen(true);
    }
  };

  const openEditComboModal = async (index: number, combo: MealCombination) => {
    setEditComboIndex(index);
    setEditComboMeat(combo.meatRecipeId.id);
    setEditComboVege(combo.vegeRecipeId.id);
    setEditComboSide(combo.sideRecipeId.id);
    setEditComboPortions(combo.portions);
    
    // Fetch recipes if not already loaded
    if (allRecipes.length === 0) {
      await fetchAllRecipes();
    }
    
    setEditComboModalOpen(true);
  };

  const handleToggleIngredient = async (ingredientName: string, checked: boolean) => {
    if (!plan) return;

    try {
      const response = await fetch(`/api/meal-plans/${plan._id}/ingredients`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientName, checked }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to toggle ingredient check:", error);
    }
  };

  // Calculate total ingredients needed
  const calculateTotalIngredients = (): AggregatedIngredient[] => {
    if (!plan || !plan.people) return [];

    const ingredientMap: { [key: string]: AggregatedIngredient } = {};
    const peopleMultiplier = plan.people.reduce((sum, person) => sum + person.modifier, 0);

    const addIngredientsFromRecipe = (recipe: Recipe | undefined, type: string, multiplier: number) => {
      if (!recipe) return;

      const ingredients = [...(recipe.mainIngredients || []), ...(recipe.seasonings || [])];
      ingredients.forEach((ing) => {
        const key = ing.name.toLowerCase();
        const match = ing.quantity.match(/^([\d.]+)(.*)$/);
        const baseNum = match ? parseFloat(match[1]) : 1;
        const unit = match ? match[2] : "";
        const total = baseNum * multiplier;
        const quantityStr = `${Math.round(total)}${unit}`;
        const source = `${recipe.title} (${type})`;

        if (!ingredientMap[key]) {
          ingredientMap[key] = {
            name: ing.name,
            quantity: quantityStr,
            sources: [source],
          };
          return;
        }

        const existingMatch = ingredientMap[key].quantity.match(/^([\d.]+)(.*)/);
        const existingNum = existingMatch ? parseFloat(existingMatch[1]) : 0;
        const existingUnit = existingMatch ? existingMatch[2] : unit;
        ingredientMap[key].quantity = `${Math.round(existingNum + total)}${existingUnit}`;

        if (!ingredientMap[key].sources.includes(source)) {
          ingredientMap[key].sources.push(source);
        }
      });
    };

    plan.combinations.forEach((combo) => {
      const recipes = [
        { recipe: combo.meatRecipeId, type: "Protein" },
        { recipe: combo.vegeRecipeId, type: "Vegetable" },
        { recipe: combo.sideRecipeId, type: "Side" },
      ];

      recipes.forEach(({ recipe, type }) => {
        addIngredientsFromRecipe(recipe, type, combo.portions * peopleMultiplier);
      });
    });

    (plan.recipes || []).forEach((recipe) => {
      addIngredientsFromRecipe(recipe, "Cart recipe", peopleMultiplier);
    });

    return Object.values(ingredientMap);
  };

  const totalIngredients = calculateTotalIngredients();

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>Error: {error}</p>
          <Link href="/meal-plans" className={styles.createLink}>
            Back to Meal Plans
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>Plan not found</p>
          <Link href="/meal-plans" className={styles.createLink}>
            Back to Meal Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Edit Bar */}
      <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px", marginBottom: "32px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Plan Name */}
          {/* Plan Name + Edit Button */}
          <div style={{ flex: 1, minWidth: "200px", display: "flex", gap: "8px", alignItems: "center" }}>
            <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: "0" }}>{plan.name}</h1>
            <button
              onClick={openEditModal}
              style={{
                padding: "6px 10px",
                backgroundColor: "white",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Edit
            </button>
          </div>

          {/* Plan Details */}
          <div style={{ display: "flex", gap: "24px", alignItems: "center", fontSize: "13px", color: "#666" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>👥</span>
              <span>{plan.people.length} people</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📅</span>
              <span>{plan.numberOfDays} days</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>🍽️</span>
              <span>{plan.mealTypes.join("/")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>🛒</span>
              <span><strong>{plan.totalMealsNeeded}</strong>  servings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Combination Section */}
      <div style={{ marginBottom: "32px" }}>
        {!showAddForm && (
          <button
            onClick={handleShowAddForm}
            style={{
              padding: "12px 24px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            + Add Combination
          </button>
        )}

        {showAddForm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}>
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "24px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                boxSizing: "border-box",
              }}
            >
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
              Add Meal Combination
            </h2>

            {addError && (
              <div
                style={{
                  backgroundColor: "#ffebee",
                  color: "#c62828",
                  padding: "12px",
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                {addError}
              </div>
            )}

            {loadingRecipes && <p style={{ color: "#999" }}>Loading recipes...</p>}

            {!loadingRecipes && (
              <>
                {/* Selection Grid - 4 columns */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "4px",
                    marginBottom: "16px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Meat Selection */}
                  <div
                    onClick={() => setMeatModalOpen(true)}
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: selectedMeat ? "none" : "2px dotted #ddd",
                      backgroundColor: selectedMeat ? "transparent" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {selectedMeat ? (
                      <>
                        <img
                          src={allRecipes.find((r) => r.id === selectedMeat)?.image}
                          alt="selected"
                          style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                        />
                        <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                          {allRecipes.find((r) => r.id === selectedMeat)?.title}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>Select protein</p>
                    )}
                  </div>

                  {/* Vege Selection */}
                  <div
                    onClick={() => setVegeModalOpen(true)}
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: selectedVege ? "none" : "2px dotted #ddd",
                      backgroundColor: selectedVege ? "transparent" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {selectedVege ? (
                      <>
                        <img
                          src={allRecipes.find((r) => r.id === selectedVege)?.image}
                          alt="selected"
                          style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                        />
                        <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                          {allRecipes.find((r) => r.id === selectedVege)?.title}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>Select vegetable</p>
                    )}
                  </div>

                  {/* Side Selection */}
                  <div
                    onClick={() => setSideModalOpen(true)}
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: selectedSide ? "none" : "2px dotted #ddd",
                      backgroundColor: selectedSide ? "transparent" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {selectedSide ? (
                      <>
                        <img
                          src={allRecipes.find((r) => r.id === selectedSide)?.image}
                          alt="selected"
                          style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                        />
                        <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                          {allRecipes.find((r) => r.id === selectedSide)?.title}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>Select side</p>
                    )}
                  </div>

                  {/* Rice (locked) */}
                  <div
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "transparent",
                      textAlign: "center",
                      color: "#999",
                      opacity: 0.7,
                    }}
                  >
                    <p style={{ fontSize: "10px", margin: "12px 0", fontWeight: "500" }}>Rice (fixed)</p>
                  </div>
                </div>

                {/* Portions */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                    Portions
                  </label>
                  <input
                    type="number"
                    value={portions}
                    onChange={(e) => setPortions(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                  <p style={{ fontSize: "12px", color: "#999", margin: "6px 0 0 0" }}>
                    Cannot exceed required meals: {plan.totalMealsNeeded}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={handleAddCombination}
                    disabled={addingCombination}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: addingCombination ? "not-allowed" : "pointer",
                      opacity: addingCombination ? 0.6 : 1,
                      fontSize: "16px",
                    }}
                  >
                    {addingCombination ? "Adding..." : "Add Combination"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setAddError(null);
                      // Close all modals
                      setMeatModalOpen(false);
                      setVegeModalOpen(false);
                      setSideModalOpen(false);
                      // Reset form
                      setSelectedMeat("");
                      setSelectedVege("");
                      setSelectedSide("");
                      setPortions(1);
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#f0f0f0",
                      color: "#333",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {/* Recipe Selection Modals */}
            <RecipeSelectionModal
              isOpen={meatModalOpen}
              recipes={allRecipes}
              loading={loadingRecipes}
              selectedId={selectedMeat}
              onSelect={(id) => {
                setSelectedMeat(id);
                setMeatModalOpen(false);
              }}
              onClose={() => setMeatModalOpen(false)}
              title="Select protein recipe"
            />
            <RecipeSelectionModal
              isOpen={vegeModalOpen}
              recipes={allRecipes}
              loading={loadingRecipes}
              selectedId={selectedVege}
              onSelect={(id) => {
                setSelectedVege(id);
                setVegeModalOpen(false);
              }}
              onClose={() => setVegeModalOpen(false)}
              title="Select vegetable recipe"
            />
            <RecipeSelectionModal
              isOpen={sideModalOpen}
              recipes={allRecipes}
              loading={loadingRecipes}
              selectedId={selectedSide}
              onSelect={(id) => {
                setSelectedSide(id);
                setSideModalOpen(false);
              }}
              onClose={() => setSideModalOpen(false)}
              title="Select side recipe"
            />
            </div>
          </div>
        )}
      </div>

      {plan.recipes && plan.recipes.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
            Recipes from Cart ({plan.recipes.length})
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {plan.recipes.map((recipe) => (
              <Link
                key={recipe._id || recipe.id}
                href={`/recipes/${recipe._id || recipe.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {recipe.image && (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }}
                  />
                )}
                <div style={{ padding: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{recipe.title}</h3>
                  {recipe.description && (
                    <p style={{ margin: "6px 0 0", color: "#666", fontSize: "12px", lineHeight: 1.4 }}>
                      {recipe.description.length > 90 ? `${recipe.description.slice(0, 90)}...` : recipe.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Combinations List */}
      {plan.combinations.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
            Added Combinations ({plan.combinations.length})
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "16px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {plan.combinations.map((combo, index) => (
              <div
                key={index}
                onClick={() => openEditComboModal(index, combo)}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  width: "100%",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "16px", color: "#333" }}>
                  Combination #{index + 1} - {combo.portions}  servings
                </h3>
                
                {/* Selection Grid - 4 columns */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "4px",
                    marginBottom: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Meat */}
                  <div
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "transparent",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={combo.meatRecipeId.image}
                      alt="meat"
                      style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                    />
                    <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                      {combo.meatRecipeId.title}
                    </p>
                  </div>

                  {/* Vege */}
                  <div
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "transparent",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={combo.vegeRecipeId.image}
                      alt="vege"
                      style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                    />
                    <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                      {combo.vegeRecipeId.title}
                    </p>
                  </div>

                  {/* Side */}
                  <div
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "transparent",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={combo.sideRecipeId.image}
                      alt="side"
                      style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                    />
                    <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                      {combo.sideRecipeId.title}
                    </p>
                  </div>

                  {/* Rice */}
                  <div
                    style={{
                      padding: "4px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "transparent",
                      textAlign: "center",
                      color: "#999",
                      opacity: 0.7,
                    }}
                  >
                    <p style={{ fontSize: "10px", margin: "12px 0", fontWeight: "500" }}>Rice (fixed)</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCombination(index);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#ffebee",
                    color: "#c62828",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Ingredients */}
      {totalIngredients.length > 0 && (
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
            Ingredient List
          </h2>
          <div style={{ backgroundColor: "white", borderRadius: "8px", overflow: "hidden" }}>
            {totalIngredients.map((ing, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  borderBottom: index < totalIngredients.length - 1 ? "1px solid #e0e0e0" : "none",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "500", marginBottom: "4px" }}>{ing.name}</p>
                  <p style={{ fontSize: "12px", color: "#999" }}>
                    {ing.sources.join(", ")}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <p style={{ minWidth: "100px", textAlign: "right", fontSize: "14px" }}>
                    {ing.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.combinations.length === 0 && (!plan.recipes || plan.recipes.length === 0) && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
          <p>No combinations added yet</p>
          <p style={{ fontSize: "14px" }}>Use the button above to add a combination.</p>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            boxSizing: "border-box",
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>Edit Plan</h2>

            {/* Edit Plan Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                Plan Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter plan name"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Edit People */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                👥 Household Members
              </label>
              <div style={{ marginBottom: "12px", maxHeight: "300px", overflowY: "auto" }}>
                {Array.isArray(editPeople) && editPeople.map((person, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "4px" }}>Name</label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => {
                          const newPeople = [...editPeople];
                          newPeople[idx].name = e.target.value;
                          setEditPeople(newPeople);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          fontSize: "13px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ width: "80px" }}>
                      <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "4px" }}>Modifier</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="5.0"
                        value={person.modifier}
                        onChange={(e) => {
                          const newPeople = [...editPeople];
                          newPeople[idx].modifier = parseFloat(e.target.value) || 1.0;
                          setEditPeople(newPeople);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          fontSize: "13px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (Array.isArray(editPeople)) {
                    setEditPeople([...editPeople, { name: `Person ${editPeople.length + 1}`, modifier: 1.0 }]);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                + Add Member
              </button>
            </div>

            {/* Edit Days */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                📅 Days
              </label>
              <input
                type="number"
                value={editDays}
                onChange={(e) => setEditDays(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Edit Meal Types */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                🍽️ Meal Types
              </label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editMealTypes.includes("lunch")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditMealTypes([...editMealTypes, "lunch"]);
                      } else {
                        setEditMealTypes(editMealTypes.filter((t) => t !== "lunch"));
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Lunch</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editMealTypes.includes("dinner")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditMealTypes([...editMealTypes, "dinner"]);
                      } else {
                        setEditMealTypes(editMealTypes.filter((t) => t !== "dinner"));
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <span>Dinner</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleSaveAllChanges}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setNewName(plan.name);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Combination Modal */}
      {editComboModalOpen && editComboIndex !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            boxSizing: "border-box",
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>Edit Combination #{editComboIndex + 1}</h2>

            {/* Recipe Selection Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
              {/* Meat */}
              <div
                onClick={() => setMeatModalOpen(true)}
                style={{
                  padding: "4px",
                  borderRadius: "8px",
                  border: editComboMeat ? "none" : "2px dotted #ddd",
                  backgroundColor: editComboMeat ? "transparent" : "white",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {editComboMeat ? (
                  <>
                    <img
                      src={allRecipes.find((r) => r.id === editComboMeat)?.image}
                      alt="selected"
                      style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                    />
                    <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                      {allRecipes.find((r) => r.id === editComboMeat)?.title}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>Select protein</p>
                )}
              </div>

              {/* Vege */}
              <div
                onClick={() => setVegeModalOpen(true)}
                style={{
                  padding: "4px",
                  borderRadius: "8px",
                  border: editComboVege ? "none" : "2px dotted #ddd",
                  backgroundColor: editComboVege ? "transparent" : "white",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {editComboVege ? (
                  <>
                    <img
                      src={allRecipes.find((r) => r.id === editComboVege)?.image}
                      alt="selected"
                      style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                    />
                    <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                      {allRecipes.find((r) => r.id === editComboVege)?.title}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>Select vegetable</p>
                )}
              </div>

              {/* Side */}
              <div
                onClick={() => setSideModalOpen(true)}
                style={{
                  padding: "4px",
                  borderRadius: "8px",
                  border: editComboSide ? "none" : "2px dotted #ddd",
                  backgroundColor: editComboSide ? "transparent" : "white",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {editComboSide ? (
                  <>
                    <img
                      src={allRecipes.find((r) => r.id === editComboSide)?.image}
                      alt="selected"
                      style={{ width: "100%", maxWidth: "60px", height: "60px", borderRadius: "4px", objectFit: "cover", marginBottom: "2px" }}
                    />
                    <p style={{ fontSize: "10px", color: "#333", margin: "0", fontWeight: "500", wordBreak: "break-word", lineHeight: "1.2" }}>
                      {allRecipes.find((r) => r.id === editComboSide)?.title}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>Select side</p>
                )}
              </div>

              {/* Rice */}
              <div
                style={{
                  padding: "4px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  textAlign: "center",
                  color: "#999",
                  opacity: 0.7,
                }}
              >
                <p style={{ fontSize: "10px", margin: "12px 0", fontWeight: "500" }}>Rice (fixed)</p>
              </div>
            </div>

            {/* Portions */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                Portions
              </label>
              <input
                type="number"
                value={editComboPortions}
                onChange={(e) => setEditComboPortions(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={async () => {
                  const editComboPortionsNum = editComboPortions === "" ? 0 : editComboPortions;
                  if (!editComboMeat || !editComboVege || !editComboSide || editComboPortionsNum < 1 || editComboIndex === null) {
                    alert("Complete all fields");
                    return;
                  }

                  if (!plan) return;

                  try {
                    // Remove old combination
                    let updatedPlan = await removeMealCombination(plan._id, editComboIndex);
                    setPlan(updatedPlan);

                    // Add new combination
                    updatedPlan = await addMealCombination(
                      plan._id,
                      editComboMeat,
                      editComboVege,
                      editComboSide,
                      editComboPortionsNum
                    );
                    setPlan(updatedPlan);
                    setEditComboModalOpen(false);
                  } catch (error) {
                    console.error("Failed to update combination:", error);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditComboModalOpen(false);
                  setEditComboIndex(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Selection Modals for Editing Combinations */}
      {editComboModalOpen && (
        <>
          <RecipeSelectionModal
            isOpen={meatModalOpen}
            recipes={allRecipes}
            loading={loadingRecipes}
            selectedId={editComboMeat}
            onSelect={(id) => {
              setEditComboMeat(id);
              setMeatModalOpen(false);
            }}
            onClose={() => setMeatModalOpen(false)}
            title="Select protein"
          />

          <RecipeSelectionModal
            isOpen={vegeModalOpen}
            recipes={allRecipes}
            loading={loadingRecipes}
            selectedId={editComboVege}
            onSelect={(id) => {
              setEditComboVege(id);
              setVegeModalOpen(false);
            }}
            onClose={() => setVegeModalOpen(false)}
            title="Select vegetable"
          />

          <RecipeSelectionModal
            isOpen={sideModalOpen}
            recipes={allRecipes}
            loading={loadingRecipes}
            selectedId={editComboSide}
            onSelect={(id) => {
              setEditComboSide(id);
              setSideModalOpen(false);
            }}
            onClose={() => setSideModalOpen(false)}
            title="Select side"
          />
        </>
      )}
    </div>
  );
}
