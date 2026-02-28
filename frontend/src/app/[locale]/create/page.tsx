"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
}

export default function CreatePage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("create");
  const tCommon = useTranslations("common");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    authorId: "507f1f77bcf86cd799439011",
    ingredients: [] as Ingredient[],
    steps: [] as Step[],
    servings: 1,
    difficulty: "Easy" as "Easy" | "Medium" | "Hard",
    tags: [] as string[],
    cuisine: "",
  });

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

  const addIngredient = () => {
    if (!currentIngredient.name || !currentIngredient.quantity || !currentIngredient.unit) {
      alert(t("validation.fillAllIngredients"));
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
      alert(t("validation.enterStepInstruction"));
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
        throw new Error(error.error || t("error.failedCreate"));
      }

      const data = await response.json();
      setMessage(`✓ ${t("success.created")}`);
      setMessageType("success");

      setFormData({
        title: "",
        description: "",
        authorId: "507f1f77bcf86cd799439011",
        ingredients: [],
        steps: [],
        servings: 1,
        difficulty: "Easy",
        tags: [],
        cuisine: "",
      });

      setTimeout(() => {
        window.location.href = `/${locale}/recipes/${data.recipe.id}`;
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
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>

      {message && (
        <div className={`${styles.message} ${messageType === "success" ? styles.messageSuccess : styles.messageError}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Recipe Basics */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📝 {t("sections.basics")}</h2>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              {t("labels.recipeName")} *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder={t("placeholders.recipeName")}
              value={formData.title}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              {t("labels.description")} *
            </label>
            <textarea
              id="description"
              name="description"
              placeholder={t("placeholders.description")}
              value={formData.description}
              onChange={handleInputChange}
              required
              className={styles.textarea}
              rows={4}
            />
          </div>
        </section>

        {/* Recipe Details */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>⚙️ {t("sections.details")}</h2>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="servings" className={styles.label}>
                {t("labels.servings")}
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

            <div className={styles.formGroup}>
              <label htmlFor="difficulty" className={styles.label}>
                {t("labels.difficulty")}
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className={styles.input}
              >
                <option value="Easy">{t("difficulty.easy")}</option>
                <option value="Medium">{t("difficulty.medium")}</option>
                <option value="Hard">{t("difficulty.hard")}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cuisine" className={styles.label}>
                {t("labels.cuisine")}
              </label>
              <input
                id="cuisine"
                type="text"
                name="cuisine"
                placeholder={t("placeholders.cuisine")}
                value={formData.cuisine}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>
          </div>
        </section>

        {/* Ingredients */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>🥘 {t("sections.ingredients")}</h2>
          </div>

          <div className={styles.ingredientForm}>
            <div className={styles.ingredientInputs}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder={t("placeholders.ingredientName")}
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
                  placeholder={t("placeholders.quantity")}
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
                  placeholder={t("placeholders.unit")}
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
                  placeholder={t("placeholders.note")}
                  value={currentIngredient.note}
                  onChange={(e) =>
                    setCurrentIngredient({ ...currentIngredient, note: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <button type="button" onClick={addIngredient} className={styles.addBtn}>
              + {t("buttons.add")}
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
            <h2>👨‍🍳 {t("sections.steps")}</h2>
          </div>

          <div className={styles.stepForm}>
            <textarea
              placeholder={t("placeholders.step")}
              value={currentStep.instruction}
              onChange={(e) =>
                setCurrentStep({ ...currentStep, instruction: e.target.value })
              }
              className={styles.textarea}
              rows={2}
            />
            <button type="button" onClick={addStep} className={styles.addBtn}>
              + {t("buttons.addStep")}
            </button>
          </div>

          {formData.steps && formData.steps.length > 0 && (
            <div className={styles.stepsList}>
              <div className={styles.list}>
                {formData.steps.map((step, idx) => (
                  <div key={idx} className={styles.stepItem}>
                    <span className={styles.stepCircle}>{step.stepNumber}</span>
                    <span className={styles.stepText}>{step.instruction}</span>
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
            <h2>🏷️ {t("sections.tags")}</h2>
          </div>

          <div className={styles.tagsForm}>
            <input
              type="text"
              placeholder={t("placeholders.tag")}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className={styles.input}
            />
            <button type="button" onClick={addTag} className={styles.addBtn}>
              + {t("buttons.add")}
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
            {loading ? t("buttons.publishing") : t("buttons.publish")}
          </button>
        </div>
      </form>
    </div>
  );
}
