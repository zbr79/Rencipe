"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSaved } from "../../contexts/SavedContext";
import { enrichRecipesWithMockImages } from "../../utils/recipeImageUtils";
import { getScheduledPlanDisplayName } from "../../utils/planDisplay";
import { authFetch } from "../../utils/authSession";
import type { WeeklyPlan, DayPlan, SavedRecipe } from "../../contexts/SavedContext";
import Link from "next/link";
import BackButton from "../../components/BackButton";

export default function WeeklyPlanEditorPage() {
  const { id } = useParams();
  const { weeklyPlans, updateMealSlot, renameWeeklyPlan, updateWeeklyPlanSettings } = useSaved();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [allRecipes, setAllRecipes] = useState<SavedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; meal: "breakfast" | "lunch" | "dinner"; index: number } | null>(null);
  const [filteredRecipes, setFilteredRecipes] = useState<SavedRecipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempMealTypes, setTempMealTypes] = useState({
    breakfast: false,
    lunch: false,
    dinner: true,
  });
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    const loadPlan = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // First try to find in context
        const foundPlan = weeklyPlans.find((p) => p._id === id);
        if (foundPlan) {
          setPlan(foundPlan);
          setTempMealTypes({
            breakfast: foundPlan.breakfastEnabled,
            lunch: foundPlan.lunchEnabled,
            dinner: foundPlan.dinnerEnabled,
          });
          setIsLoading(false);
          return;
        }

        // If not in context, fetch from API
        if (id) {
          const response = await fetch(`/api/weekly-plans/${id}`);
          if (!response.ok) throw new Error("Failed to fetch plan");
          const data = await response.json();
          
          // Handle different response structures
          let planData = data.plan || data.weeklyPlan || data;
          
          // Ensure days array exists
          if (!planData || !planData.days) {
            throw new Error("Plan data is malformed or missing days");
          }
          
          setPlan(planData);
          setTempMealTypes({
            breakfast: planData.breakfastEnabled,
            lunch: planData.lunchEnabled,
            dinner: planData.dinnerEnabled,
          });
        }
      } catch (err: any) {
        console.error("Error loading plan:", err);
        setLoadError(err.message || "Failed to load plan");
        setPlan(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlan();
  }, [weeklyPlans, id]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoadingRecipes(true);
        const response = await authFetch(`/api/recipes`);
        if (!response.ok) throw new Error("Failed to fetch recipes");
        const data = await response.json();
        const recipes = data.recipes || [];
        const enriched = enrichRecipesWithMockImages(recipes) as SavedRecipe[];
        setAllRecipes(enriched);
        setFilteredRecipes(enriched);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      } finally {
        setLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRecipes(allRecipes);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredRecipes(
        allRecipes.filter((r) => r.title.toLowerCase().includes(lower) || r.description.toLowerCase().includes(lower))
      );
    }
  }, [searchTerm, allRecipes]);

  const handleSelectRecipe = async (recipe: SavedRecipe) => {
    if (!plan || !selectedSlot) return;

    try {
      const updated = await updateMealSlot(plan._id, selectedSlot.day, selectedSlot.meal, recipe._id || recipe.id, undefined);
      setPlan(updated);
      setSelectedSlot(null);
      setSearchTerm("");
    } catch (err) {
      console.error("Error updating meal slot:", err);
    }
  };

  const handleRemoveRecipe = async (day: string, meal: "breakfast" | "lunch" | "dinner", index: number) => {
    if (!plan) return;
    try {
      const updated = await updateMealSlot(plan._id, day, meal, null, index);
      setPlan(updated);
    } catch (err) {
      console.error("Error removing recipe:", err);
    }
  };

  const handleStartEditName = () => {
    if (plan) {
      setEditedName(getScheduledPlanDisplayName(plan.name));
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!plan || !editedName.trim()) return;
    try {
      const updated = await renameWeeklyPlan(plan._id, editedName);
      setPlan(updated);
      setIsEditingName(false);
    } catch (err) {
      console.error("Error renaming plan:", err);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleOpenSettingsModal = () => {
    if (plan) {
      setTempName(getScheduledPlanDisplayName(plan.name));
      setTempMealTypes({
        breakfast: plan.breakfastEnabled,
        lunch: plan.lunchEnabled,
        dinner: plan.dinnerEnabled,
      });
      setIsSettingsModalOpen(true);
    }
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const handleSaveSettings = async () => {
    if (!plan) return;

    const enabledMeals = (["breakfast", "lunch", "dinner"] as const).filter(
      (type) => tempMealTypes[type]
    );

    try {
      let updated = plan;
      
      // Update name if it changed
      if (tempName !== getScheduledPlanDisplayName(plan.name) && tempName.trim()) {
        updated = await renameWeeklyPlan(plan._id, tempName);
      }
      
      // Update meal settings if they changed
      const mealsChanged = 
        enabledMeals.length !== [plan.breakfastEnabled, plan.lunchEnabled, plan.dinnerEnabled].filter(Boolean).length ||
        enabledMeals.some(meal => !tempMealTypes[meal]);
      
      if (mealsChanged) {
        updated = await updateWeeklyPlanSettings(plan._id, enabledMeals);
      }
      
      setPlan(updated);
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  if (isLoading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  if (loadError || !plan) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: "16px" }}>
          {loadError || "Unable to load plan"}
        </p>
        <BackButton
          fallbackHref="/meal-plans"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: 0,
            backgroundColor: "transparent",
            color: "#64748b",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 850,
          }}
        />
      </div>
    );
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        {isEditingName ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              style={{
                fontSize: "28px",
                fontWeight: "700",
                padding: "8px 12px",
                border: "2px solid #3b82f6",
                borderRadius: "6px",
                flex: 1,
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") handleCancelEditName();
              }}
            />
            <button
              onClick={handleSaveName}
              style={{
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancelEditName}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <h1 style={{ margin: 0 }}>{getScheduledPlanDisplayName(plan.name)}</h1>
            <button
              onClick={handleOpenSettingsModal}
              style={{
                padding: "6px 10px",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "18px",
              }}
              title="Edit settings"
            >
              ⚙️
            </button>
          </div>
        )}
        <BackButton
          fallbackHref="/meal-plans"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: 0,
            backgroundColor: "transparent",
            color: "#64748b",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 850,
          }}
        />
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div
          style={{
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
          }}
          onClick={handleCloseSettingsModal}
        >
          <div
            style={{
              backgroundColor: "var(--card-bg, white)",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 20px", fontSize: "18px" }}>Edit Plan</h2>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                Plan Name
              </label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter plan name"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--border-color, #d1d5db)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "500", fontSize: "14px" }}>
                Select meal types
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={tempMealTypes.breakfast}
                    onChange={(e) => setTempMealTypes({ ...tempMealTypes, breakfast: e.target.checked })}
                    style={{ marginRight: "8px", cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  <span style={{ fontSize: "14px" }}>Breakfast</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={tempMealTypes.lunch}
                    onChange={(e) => setTempMealTypes({ ...tempMealTypes, lunch: e.target.checked })}
                    style={{ marginRight: "8px", cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  <span style={{ fontSize: "14px" }}>Lunch</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={tempMealTypes.dinner}
                    onChange={(e) => setTempMealTypes({ ...tempMealTypes, dinner: e.target.checked })}
                    style={{ marginRight: "8px", cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  <span style={{ fontSize: "14px" }}>Dinner</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCloseSettingsModal}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #d1d5db)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Days Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {plan && Array.isArray(plan.days) && plan.days.map((day: DayPlan, idx: number) => (
          <div
            key={idx}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "16px",
              backgroundColor: "#f9fafb",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600" }}>{dayLabels[idx]}</h3>

            {/* Breakfast */}
            <div style={{ marginBottom: "16px", display: plan.breakfastEnabled ? "block" : "none" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "500" }}>Breakfast</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                {Array.isArray(day.breakfast) && day.breakfast.length > 0 ? (
                  day.breakfast.map((recipeId: any, recipeIdx: number) => {
                    const recipe = typeof recipeId === "object" ? recipeId : null;
                    return (
                      <div key={recipeIdx} style={{ textAlign: "center" }}>
                        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "500", minHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {recipe?.title || "Unknown recipe"}
                        </p>
                        <div
                          style={{
                            position: "relative",
                            backgroundColor: "white",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            overflow: "hidden",
                          }}
                        >
                          {recipe?.image && (
                            <img
                              src={recipe.image}
                              alt={recipe?.title}
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          )}
                          <button
                            onClick={() => handleRemoveRecipe(day.dayOfWeek, "breakfast", recipeIdx)}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              width: "28px",
                              height: "28px",
                              padding: 0,
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: "1",
                            }}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : null}
                <button
                  onClick={() => setSelectedSlot({ day: day.dayOfWeek, meal: "breakfast", index: -1 })}
                  style={{
                    height: "140px",
                    backgroundColor: "white",
                    border: "2px dashed #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "#666",
                    fontSize: "24px",
                    fontWeight: "300",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            {/* Lunch */}
            <div style={{ marginBottom: "16px", display: plan.lunchEnabled ? "block" : "none" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "500" }}>Lunch</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                {Array.isArray(day.lunch) && day.lunch.length > 0 ? (
                  day.lunch.map((recipeId: any, recipeIdx: number) => {
                    const recipe = typeof recipeId === "object" ? recipeId : null;
                    return (
                      <div key={recipeIdx} style={{ textAlign: "center" }}>
                        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "500", minHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {recipe?.title || "Unknown recipe"}
                        </p>
                        <div
                          style={{
                            position: "relative",
                            backgroundColor: "white",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            overflow: "hidden",
                          }}
                        >
                          {recipe?.image && (
                            <img
                              src={recipe.image}
                              alt={recipe?.title}
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          )}
                          <button
                            onClick={() => handleRemoveRecipe(day.dayOfWeek, "lunch", recipeIdx)}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              width: "28px",
                              height: "28px",
                              padding: 0,
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: "1",
                            }}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : null}
                <button
                  onClick={() => setSelectedSlot({ day: day.dayOfWeek, meal: "lunch", index: -1 })}
                  style={{
                    height: "140px",
                    backgroundColor: "white",
                    border: "2px dashed #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "#666",
                    fontSize: "24px",
                    fontWeight: "300",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            {/* Dinner */}
            <div style={{ marginBottom: "16px", display: plan.dinnerEnabled ? "block" : "none" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "500" }}>Dinner</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                {Array.isArray(day.dinner) && day.dinner.length > 0 ? (
                  day.dinner.map((recipeId: any, recipeIdx: number) => {
                    const recipe = typeof recipeId === "object" ? recipeId : null;
                    return (
                      <div key={recipeIdx} style={{ textAlign: "center" }}>
                        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "500", minHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {recipe?.title || "Unknown recipe"}
                        </p>
                        <div
                          style={{
                            position: "relative",
                            backgroundColor: "white",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            overflow: "hidden",
                          }}
                        >
                          {recipe?.image && (
                            <img
                              src={recipe.image}
                              alt={recipe?.title}
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          )}
                          <button
                            onClick={() => handleRemoveRecipe(day.dayOfWeek, "dinner", recipeIdx)}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              width: "28px",
                              height: "28px",
                              padding: 0,
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: "1",
                            }}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : null}
                <button
                  onClick={() => setSelectedSlot({ day: day.dayOfWeek, meal: "dinner", index: -1 })}
                  style={{
                    height: "140px",
                    backgroundColor: "white",
                    border: "2px dashed #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "#666",
                    fontSize: "24px",
                    fontWeight: "300",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Selection Modal */}
      {selectedSlot && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedSlot(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>
              Select {selectedSlot.meal === "breakfast" ? "Breakfast" : selectedSlot.meal === "lunch" ? "Lunch" : "Dinner"} Recipe
            </h2>

            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />

            {loadingRecipes ? (
              <p>Loading...</p>
            ) : filteredRecipes.length === 0 ? (
              <p style={{ color: "#999" }}>No recipes available</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe._id || recipe.id}
                    style={{
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => handleSelectRecipe(recipe)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <p style={{ margin: "0 0 4px", fontWeight: "500" }}>{recipe.title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{recipe.description}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setSelectedSlot(null)}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "16px",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
