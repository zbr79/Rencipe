"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  note?: string;
}

interface Step {
  stepNumber: number;
  instruction: string;
  image?: string;
}

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    authorId: "507f1f77bcf86cd799439011",
    ingredients: [] as Ingredient[],
    steps: [] as Step[],
    servings: 1,
    tags: [] as string[],
  });

  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);

  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    name: "",
    quantity: 0,
    unit: "",
    note: "",
  });

  const [currentStep, setCurrentStep] = useState<Step>({
    stepNumber: (formData.steps?.length || 0) + 1,
    instruction: "",
  });

  const [stepImages, setStepImages] = useState<{ [key: number]: string }>({});
  const [stepImageFiles, setStepImageFiles] = useState<{ [key: number]: File }>({});

  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "servings" ? Number(value) : value,
    }));
  };

  const handleRecipeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecipeImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setRecipeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepImageChange = (e: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => {
    const file = e.target.files?.[0];
    if (file) {
      setStepImageFiles((prev) => ({ ...prev, [stepNumber]: file }));
      const reader = new FileReader();
      reader.onload = () => {
        setStepImages((prev) => ({ ...prev, [stepNumber]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    if (!currentIngredient.name || !currentIngredient.quantity || !currentIngredient.unit) {
      alert("请填写所有配料信息");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), currentIngredient],
    }));
    setCurrentIngredient({ name: "", quantity: 0, unit: "", note: "" });
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const addStep = () => {
    if (!currentStep.instruction) {
      alert("请输入煮饪步骤");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), { ...currentStep, stepNumber: (prev.steps?.length || 0) + 1 }],
    }));
    setCurrentStep({
      stepNumber: (formData.steps?.length || 0) + 2,
      instruction: "",
    });
  };

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (tagsInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()],
      }));
      setTagsInput("");
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "创建食谱失败");
      }

      const data = await response.json();
      const recipeId = data.recipe.id;

      // Upload recipe image if exists
      if (recipeImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", recipeImageFile);
        await fetch(`${apiUrl}/recipes/${recipeId}/upload-image`, {
          method: "POST",
          body: imageFormData,
        });
      }

      // Upload step images if exist
      for (const [stepNumber, file] of Object.entries(stepImageFiles)) {
        const stepFormData = new FormData();
        stepFormData.append("image", file);
        await fetch(`${apiUrl}/recipes/${recipeId}/steps/${stepNumber}/upload-image`, {
          method: "POST",
          body: stepFormData,
        });
      }

      setMessage(`✓ 食谱已创建`);
      setMessageType("success");

      setFormData({
        title: "",
        description: "",
        authorId: "507f1f77bcf86cd799439011",
        ingredients: [],
        steps: [],
        servings: 1,
        tags: [],
      });
      setRecipeImage(null);
      setRecipeImageFile(null);
      setStepImages({});
      setStepImageFiles({});

      setTimeout(() => {
        window.location.href = `/recipes/${recipeId}`;
      }, 1500);
    } catch (error: any) {
      setMessage(`✗ ${error.message}`);
      setMessageType("error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>创建食谱</h1>
        <p>分享你的烹饪创意</p>
      </div>

      {message && (
        <div className={`${styles.message} ${messageType === "success" ? styles.messageSuccess : styles.messageError}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Recipe Basics */}
        <section className={styles.section}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              食谱名称
            </label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="输入食谱名称..."
              value={formData.title}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              简介
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="菜谱简介..."
              value={formData.description}
              onChange={handleInputChange}
              required
              className={styles.textarea}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="recipeImage" className={styles.label}>
              食谱封面图片
            </label>
            <input
              id="recipeImage"
              type="file"
              accept="image/*"
              onChange={handleRecipeImageChange}
              className={styles.input}
            />
            {recipeImage && (
              <div style={{ marginTop: "16px" }}>
                <img src={recipeImage} alt="Recipe preview" style={{ maxWidth: "200px", borderRadius: "8px" }} />
              </div>
            )}
          </div>
        </section>

        {/* Recipe Details */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>详细信息</h2>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="servings" className={styles.label}>
                份数
              </label>
              <input
                id="servings"
                type="number"
                name="servings"
                placeholder="4"
                value={formData.servings}
                onChange={handleInputChange}
                min="1"
                className={styles.input}
              />
            </div>


          </div>
        </section>

        {/* Ingredients */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>配料</h2>
          </div>

          <div className={styles.ingredientForm}>
            <div className={styles.ingredientInputs}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="配料名称"
                  value={currentIngredient.name}
                  onChange={(e) =>
                    setCurrentIngredient({ ...currentIngredient, name: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="number"
                  placeholder="数量"
                  value={currentIngredient.quantity}
                  onChange={(e) =>
                    setCurrentIngredient({
                      ...currentIngredient,
                      quantity: Number(e.target.value),
                    })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="单位"
                  value={currentIngredient.unit}
                  onChange={(e) =>
                    setCurrentIngredient({ ...currentIngredient, unit: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="备注"
                  value={currentIngredient.note}
                  onChange={(e) =>
                    setCurrentIngredient({ ...currentIngredient, note: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <button type="button" onClick={addIngredient} className={styles.addBtn}>
              + 添加
            </button>
          </div>

          {formData.ingredients && formData.ingredients.length > 0 && (
            <div className={styles.ingredientsList}>
              <div className={styles.list}>
                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className={styles.ingredientItem}>
                    <span className={styles.ingredientText}>
                      {ing.quantity} {ing.unit} {ing.name}
                      {ing.note && <span className={styles.note}> — {ing.note}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Cooking Steps */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>烹饪步骤</h2>
          </div>

          <div className={styles.stepForm}>
            <textarea
              placeholder="描述每个烹饪步骤..."
              value={currentStep.instruction}
              onChange={(e) =>
                setCurrentStep({ ...currentStep, instruction: e.target.value })
              }
              className={styles.textarea}
              rows={2}
            />
            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", fontSize: "14px", marginBottom: "8px" }}>
                步骤图片 (可选)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleStepImageChange(e, currentStep.stepNumber)}
                className={styles.input}
              />
              {stepImages[currentStep.stepNumber] && (
                <img 
                  src={stepImages[currentStep.stepNumber]} 
                  alt="Step preview" 
                  style={{ maxWidth: "150px", marginTop: "8px", borderRadius: "4px" }} 
                />
              )}
            </div>
            <button type="button" onClick={addStep} className={styles.addBtn}>
              + 添加步骤
            </button>
          </div>

          {formData.steps && formData.steps.length > 0 && (
            <div className={styles.stepsList}>
              <div className={styles.list}>
                {formData.steps.map((step, idx) => (
                  <div key={idx} className={styles.stepItem}>
                    <span className={styles.stepCircle}>{step.stepNumber}</span>
                    <div style={{ flex: 1 }}>
                      <span className={styles.stepText}>{step.instruction}</span>
                      {stepImages[step.stepNumber] && (
                        <img 
                          src={stepImages[step.stepNumber]} 
                          alt={`Step ${step.stepNumber}`} 
                          style={{ maxWidth: "120px", marginTop: "8px", display: "block", borderRadius: "4px" }} 
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Tags */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>标签</h2>
          </div>

          <div className={styles.tagsForm}>
            <input
              type="text"
              placeholder="输入标签并按回车..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className={styles.input}
            />
            <button type="button" onClick={addTag} className={styles.addBtn}>
              + 添加
            </button>
          </div>

          {formData.tags && formData.tags.length > 0 && (
            <div className={styles.tagsList}>
              {formData.tags.map((tag, idx) => (
                <span key={idx} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(idx)}
                    className={styles.tagRemove}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className={styles.submitContainer}>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "提交中..." : "创建食谱"}
          </button>
        </div>
      </form>
    </div>
  );
}
