"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../../contexts/SavedContext";
import styles from "../../recipes/page.module.css";

interface Recipe {
  id: string;
  title: string;
  description: string;
  component: boolean;
  mainIngredients: Array<{ name: string; quantity: string }>;
  seasonings: Array<{ name: string; quantity: string }>;
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
  numberOfPeople: number;
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

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");


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
        // Only show recipes marked as components for meal prep
        const componentRecipes = (data.recipes || []).filter((recipe: Recipe) => recipe.component === true);
        setAllRecipes(componentRecipes);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleShowAddForm = async () => {
    setShowAddForm(true);
    if (allRecipes.length === 0) {
      await fetchAllRecipes();
    }
  };

  const handleAddCombination = async () => {
    if (!selectedMeat || !selectedVege || !selectedSide || portions < 1) {
      setAddError("请填写所有字段");
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
        portions
      );

      setPlan(updatedPlan);
      setShowAddForm(false);
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
    if (!plan || !plan.combinations) return [];

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
          if (!ingredientMap[key]) {
            ingredientMap[key] = {
              name: ing.name,
              quantity: `${combo.portions} x ${ing.quantity}`,
              sources: [`${recipe.title} (${type})`],
            };
          } else {
            ingredientMap[key].quantity += `; ${combo.portions} x ${ing.quantity}`;
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
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          {isRenaming ? (
            <div style={{ display: "flex", gap: "8px", flex: 1 }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: "8px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  border: "2px solid #4CAF50",
                  borderRadius: "4px",
                }}
              />
              <button
                onClick={handleRenamePlan}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                保存
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>{plan.name}</h1>
              <button
                onClick={() => setIsRenaming(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                重命名
              </button>
            </>
          )}
        </div>

        {/* Plan Info */}
        <div style={{ backgroundColor: "#f5f5f5", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
          <p style={{ margin: "4px 0", color: "#666" }}>
            👥 {plan.numberOfPeople} 人 | 📅 {plan.numberOfDays} 天 | 🍽️ {plan.mealTypes.join("/")}
          </p>
          <p style={{ margin: "4px 0", color: "#999" }}>
            总需要: <strong>{plan.totalMealsNeeded}</strong> 份餐
          </p>
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
          <div
            style={{
              backgroundColor: "#f9f9f9",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "20px",
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
                {/* Meat Selection */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    肉类 (必选)
                  </label>
                  <select
                    value={selectedMeat}
                    onChange={(e) => setSelectedMeat(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">-- 选择肉类食谱 --</option>
                    {allRecipes.map((recipe, index) => (
                      <option key={recipe.id || index} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vege Selection */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    蔬菜 (必选)
                  </label>
                  <select
                    value={selectedVege}
                    onChange={(e) => setSelectedVege(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">-- 选择蔬菜食谱 --</option>
                    {allRecipes.map((recipe, index) => (
                      <option key={recipe.id || index} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Side Selection */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    配菜 (必选)
                  </label>
                  <select
                    value={selectedSide}
                    onChange={(e) => setSelectedSide(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">-- 选择配菜食谱 --</option>
                    {allRecipes.map((recipe, index) => (
                      <option key={recipe.id || index} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rice (locked) */}
                <div style={{ marginBottom: "16px", opacity: 0.6 }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    主食 (固定: 米饭)
                  </label>
                  <input
                    type="text"
                    value="米饭"
                    disabled
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                </div>

                {/* Portions */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    份量数 (需要多少份这个组合?)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={portions}
                    onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  />
                  <p style={{ fontSize: "12px", color: "#999", margin: "8px 0 0 0" }}>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {plan.combinations.map((combo, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>
                    组合 #{index + 1} - {combo.portions} 份
                  </h3>
                  <p style={{ fontSize: "13px", color: "#666", margin: "4px 0" }}>
                    <strong>肉:</strong> {combo.meatRecipeId.title}
                  </p>
                  <p style={{ fontSize: "13px", color: "#666", margin: "4px 0" }}>
                    <strong>菜:</strong> {combo.vegeRecipeId.title}
                  </p>
                  <p style={{ fontSize: "13px", color: "#666", margin: "4px 0" }}>
                    <strong>配菜:</strong> {combo.sideRecipeId.title}
                  </p>
                  <p style={{ fontSize: "13px", color: "#666", margin: "4px 0" }}>
                    <strong>主食:</strong> 米饭
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveCombination(index)}
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
    </div>
  );
}
