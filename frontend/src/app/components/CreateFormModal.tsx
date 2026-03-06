"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import { useSaved } from "../contexts/SavedContext";
import styles from "./create-form-modal.module.css";

export default function CreateFormModal() {
  const { isOpen, closeCreateForm, setRecipeImage, setRecipeImageFile, showMealPlanForm, setShowMealPlanForm } = useCreateForm();
  const { createMealPlan, fetchMealPlans } = useSaved();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = "507f1f77bcf86cd799439011";
  
  const [mealPlanState, setMealPlanState] = useState({
    numberOfPeople: 2,
    numberOfDays: 3,
    mealTypes: ['lunch'] as ('lunch' | 'dinner')[],
    name: "",
    loading: false,
    error: null as string | null,
  });

  const handleRecipeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecipeImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setRecipeImage(imageData);
        closeCreateForm();
        router.push("/create");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMealTypeToggle = (type: 'lunch' | 'dinner') => {
    setMealPlanState((prev) => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(type)
        ? prev.mealTypes.filter((t) => t !== type)
        : [...prev.mealTypes, type],
    }));
  };

  const handleCreateMealPlan = async () => {
    if (mealPlanState.mealTypes.length === 0) {
      setMealPlanState((prev) => ({ ...prev, error: "请至少选择一个餐次" }));
      return;
    }

    setMealPlanState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const newPlan = await createMealPlan(
        userId,
        mealPlanState.numberOfPeople,
        mealPlanState.numberOfDays,
        mealPlanState.mealTypes,
        mealPlanState.name || `${mealPlanState.numberOfPeople}人${mealPlanState.numberOfDays}天计划`
      );

      await fetchMealPlans(userId);
      closeCreateForm();
      router.push(`/meal-plans/${newPlan._id}`);
    } catch (err: any) {
      setMealPlanState((prev) => ({ ...prev, error: err.message }));
    } finally {
      setMealPlanState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!isOpen) return null;

  if (showMealPlanForm) {
    return (
      <div className={styles.modalOverlay} onClick={closeCreateForm}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button className={styles.closeBtn} onClick={() => { setShowMealPlanForm(false); closeCreateForm(); }}>✕</button>
          <div className={styles.formContainer}>
            <h1 className={styles.menuTitle}>创建新膳食计划</h1>
            {mealPlanState.error && (
              <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
                {mealPlanState.error}
              </div>
            )}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>人数</label>
              <input type="number" min="1" value={mealPlanState.numberOfPeople} onChange={(e) => setMealPlanState((prev) => ({ ...prev, numberOfPeople: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "16px", backgroundColor: "var(--card-bg)", color: "var(--foreground)", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>天数</label>
              <input type="number" min="1" value={mealPlanState.numberOfDays} onChange={(e) => setMealPlanState((prev) => ({ ...prev, numberOfDays: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "16px", backgroundColor: "var(--card-bg)", color: "var(--foreground)", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "500" }}>包括哪些餐次</label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={mealPlanState.mealTypes.includes("lunch")} onChange={() => handleMealTypeToggle("lunch")} style={{ marginRight: "8px", cursor: "pointer" }} />午餐
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={mealPlanState.mealTypes.includes("dinner")} onChange={() => handleMealTypeToggle("dinner")} style={{ marginRight: "8px", cursor: "pointer" }} />晚餐
                </label>
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>计划名称 (可选)</label>
              <input type="text" value={mealPlanState.name} onChange={(e) => setMealPlanState((prev) => ({ ...prev, name: e.target.value }))} placeholder={`${mealPlanState.numberOfPeople}人${mealPlanState.numberOfDays}天计划`} style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "16px", backgroundColor: "var(--card-bg)", color: "var(--foreground)", boxSizing: "border-box" }} />
            </div>
            <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "12px", borderRadius: "4px", marginBottom: "20px", fontSize: "14px" }}>总共需要 <strong>{mealPlanState.numberOfPeople * mealPlanState.numberOfDays * mealPlanState.mealTypes.length}</strong> 份餐</div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleCreateMealPlan} disabled={mealPlanState.loading} style={{ flex: 1, padding: "12px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "4px", cursor: mealPlanState.loading ? "not-allowed" : "pointer", opacity: mealPlanState.loading ? 0.6 : 1, fontSize: "16px", fontWeight: "600" }}>{mealPlanState.loading ? "创建中..." : "创建计划"}</button>
              <button onClick={() => { setShowMealPlanForm(false); closeCreateForm(); }} style={{ flex: 1, padding: "12px", backgroundColor: "var(--hover-bg)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer", fontSize: "16px", fontWeight: "600" }}>取消</button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleRecipeImageChange} style={{ display: "none" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={closeCreateForm}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={closeCreateForm}>✕</button>
        <div className={styles.menuContainer}>
          <h1 className={styles.menuTitle}>选择操作</h1>
          <button className={styles.menuOption} onClick={() => fileInputRef.current?.click()}>
            <span className={styles.menuIcon}>📝</span>
            <span className={styles.menuLabel}>创建菜单</span>
          </button>
          <button className={styles.menuOption} onClick={() => setShowMealPlanForm(true)}>
            <span className={styles.menuIcon}>📋</span>
            <span className={styles.menuLabel}>新建计划</span>
          </button>
          <button className={styles.menuOption} onClick={() => { closeCreateForm(); router.push("/weekly-plans/create"); }}>
            <span className={styles.menuIcon}>📅</span>
            <span className={styles.menuLabel}>新建周计划</span>
          </button>
          <button className={styles.menuOption} disabled style={{ opacity: 0.5 }}>
            <span className={styles.menuIcon}>🎨</span>
            <span className={styles.menuLabel}>发布作品</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleRecipeImageChange} style={{ display: "none" }} />
      </div>
    </div>
  );
}
