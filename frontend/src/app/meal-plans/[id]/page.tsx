"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../../contexts/SavedContext";
import styles from "../../recipes/page.module.css";
import RecipeSelectionModal from "./components/RecipeSelectionModal";
import { enrichRecipesWithMockImages } from "../../utils/recipeImageUtils";

interface Recipe {
  id: string;
  title: string;
  description: string;
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
  const [portions, setPortions] = useState(1);
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
  const [editDays, setEditDays] = useState(0);
  const [editMealTypes, setEditMealTypes] = useState<('lunch' | 'dinner')[]>([]);
  const [editTotalMeals, setEditTotalMeals] = useState(0);
  
  // Edit combination modal state
  const [editComboModalOpen, setEditComboModalOpen] = useState(false);
  const [editComboIndex, setEditComboIndex] = useState<number | null>(null);
  const [editComboMeat, setEditComboMeat] = useState("");
  const [editComboVege, setEditComboVege] = useState("");
  const [editComboSide, setEditComboSide] = useState("");
  const [editComboPortions, setEditComboPortions] = useState(1);
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
      const response = await fetch(`/api/recipes`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.recipes?.length || 0} recipes from backend`);
        
        // Only show component recipes
        const recipesToUse = (data.recipes || []).filter((recipe: Recipe) => recipe.component === true);
        console.log(`Filtered to ${recipesToUse.length} component recipes`);
        
        // Enrich with mock images
        const enrichedRecipes = enrichRecipesWithMockImages(recipesToUse);
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
      setAddError("请填写所有字段，份量必须大于0");
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
      alert("需要至少一个人");
      return;
    }
    const days = editDays === "" ? plan.numberOfDays : parseInt(String(editDays));

    if (isNaN(days) || days < 1) {
      alert("天数必须是大于0的数字");
      return;
    }

    // Validate people have names and modifiers
    for (const person of editPeople) {
      if (!person.name || !person.modifier || person.modifier < 0.1 || person.modifier > 5.0) {
        alert("每个人必须有名字和有效的系数 (0.1-5.0)");
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
    if (!plan || !plan.combinations || !plan.people) return [];

    const ingredientMap: { [key: string]: AggregatedIngredient } = {};

    plan.combinations.forEach((combo) => {
      const recipes = [
        { recipe: combo.meatRecipeId, type: "肉" },
        { recipe: combo.vegeRecipeId, type: "菜" },
        { recipe: combo.sideRecipeId, type: "配菜" },
      ];

      recipes.forEach(({ recipe, type }) => {
        if (!recipe) return;

        const ingredients = [...(recipe.mainIngredients || []), ...(recipe.seasonings || [])];
        ingredients.forEach((ing) => {
          const key = ing.name.toLowerCase();
          
          // Parse quantity (e.g., "600g" -> {number: 600, unit: "g"})
          const match = ing.quantity.match(/^([\d.]+)(.*)$/);
          const baseNum = match ? parseFloat(match[1]) : 1;
          const unit = match ? match[2] : "";
          
          // Calculate total for all people with modifiers applied
          const total = combo.portions * plan.people.reduce((sum, person) => 
            sum + baseNum * person.modifier, 0
          );
          
          const quantityStr = `${Math.round(total)}${unit}`;
          
          if (!ingredientMap[key]) {
            ingredientMap[key] = {
              name: ing.name,
              quantity: quantityStr,
              sources: [`${recipe.title} (${type})`],
            };
          } else {
            // Sum quantities from multiple sources
            const existingMatch = ingredientMap[key].quantity.match(/^([\d.]+)(.*)/);
            const existingNum = existingMatch ? parseFloat(existingMatch[1]) : 0;
            const existingUnit = existingMatch ? existingMatch[2] : unit;
            const summedTotal = existingNum + total;
            ingredientMap[key].quantity = `${Math.round(summedTotal)}${existingUnit}`;
            
            if (!ingredientMap[key].sources.includes(`${recipe.title} (${type})`)) {
              ingredientMap[key].sources.push(`${recipe.title} (${type})`);
            }
          }
        });
      });
    });

    return Object.values(ingredientMap);
  };

  const totalIngredients = calculateTotalIngredients();

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>错误: {error}</p>
          <Link href="/meal-plans" className={styles.createLink}>
            返回计划列表
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>找不到此计划</p>
          <Link href="/meal-plans" className={styles.createLink}>
            返回计划列表
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
              编辑
            </button>
          </div>

          {/* Plan Details */}
          <div style={{ display: "flex", gap: "24px", alignItems: "center", fontSize: "13px", color: "#666" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>👥</span>
              <span>{plan.people.length} 人</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📅</span>
              <span>{plan.numberOfDays} 天</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>🍽️</span>
              <span>{plan.mealTypes.join("/")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>🛒</span>
              <span><strong>{plan.totalMealsNeeded}</strong> 份</span>
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
            + 添加组合
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
              添加新组合
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

            {loadingRecipes && <p style={{ color: "#999" }}>加载食谱中...</p>}

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
                      <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>选择肉</p>
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
                      <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>选择菜</p>
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
                      <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>选择配菜</p>
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
                    <p style={{ fontSize: "10px", margin: "12px 0", fontWeight: "500" }}>米饭 (固定)</p>
                  </div>
                </div>

                {/* Portions */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                    份量数
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
                    不能超过所需总份数: {plan.totalMealsNeeded}
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
                    {addingCombination ? "添加中..." : "添加组合"}
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
                    取消
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
              title="选择肉类食谱"
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
              title="选择蔬菜食谱"
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
              title="选择配菜食谱"
            />
            </div>
          </div>
        )}
      </div>

      {/* Combinations List */}
      {plan.combinations.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
            已添加的组合 ({plan.combinations.length})
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
                  组合 #{index + 1} - {combo.portions} 份
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
                    <p style={{ fontSize: "10px", margin: "12px 0", fontWeight: "500" }}>米饭 (固定)</p>
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
                  删除
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
            所需食材清单
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
                  <input
                    type="checkbox"
                    checked={plan.checkedIngredients.includes(ing.name)}
                    onChange={(e) => handleToggleIngredient(ing.name, e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.combinations.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
          <p>还没有添加任何组合</p>
          <p style={{ fontSize: "14px" }}>点击上面的按钮开始添加组合</p>
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
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>编辑计划</h2>

            {/* Edit Plan Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                计划名称
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入计划名称"
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
                👥 家庭成员设置
              </label>
              <div style={{ marginBottom: "12px", maxHeight: "300px", overflowY: "auto" }}>
                {Array.isArray(editPeople) && editPeople.map((person, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "4px" }}>名字</label>
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
                      <label style={{ display: "block", fontSize: "11px", color: "#999", marginBottom: "4px" }}>系数</label>
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
                + 新增成员
              </button>
            </div>

            {/* Edit Days */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                📅 天数
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
                🍽️ 餐型
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
                  <span>午餐</span>
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
                  <span>晚餐</span>
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
                保存
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
                取消
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
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>编辑组合 #{editComboIndex + 1}</h2>

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
                  <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>选择肉</p>
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
                  <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>选择菜</p>
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
                  <p style={{ fontSize: "11px", color: "#999", margin: "8px 0", fontWeight: "400" }}>选择配菜</p>
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
                <p style={{ fontSize: "10px", margin: "12px 0", fontWeight: "500" }}>米饭 (固定)</p>
              </div>
            </div>

            {/* Portions */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "13px", color: "#666" }}>
                份量数
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
                  if (!editComboMeat || !editComboVege || !editComboSide || editComboPortions < 1) {
                    alert("请填写所有字段");
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
                      editComboPortions
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
                保存
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
                取消
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
            title="选择肉类"
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
            title="选择蔬菜"
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
            title="选择配菜"
          />
        </>
      )}
    </div>
  );
}
