"use client";

import { useState } from "react";
import styles from "./create.module.css";

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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    authorId: "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId format
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

  // Handle basic input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "servings" ? Number(value) : value,
    }));
  };

  // Add ingredient
  const addIngredient = () => {
    if (!currentIngredient.name || !currentIngredient.quantity || !currentIngredient.unit) {
      alert("Please fill in all ingredient fields");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), currentIngredient],
    }));
    setCurrentIngredient({ name: "", quantity: 0, unit: "", note: "" });
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  // Add step
  const addStep = () => {
    if (!currentStep.instruction) {
      alert("Please enter step instruction");
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

  // Remove step
  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  // Add tags
  const addTag = () => {
    if (tagsInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()],
      }));
      setTagsInput("");
    }
  };

  // Remove tag
  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // Submit form
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
        throw new Error(error.error || "Failed to create recipe");
      }

      const data = await response.json();
      setMessage("✓ Recipe created successfully!");
      setMessageType("success");
      
      // Reset form
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

      // Redirect after success (optional)
      setTimeout(() => {
        window.location.href = `/recipe/${data.recipe.id}`;
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
        <h1>Create Your Recipe</h1>
        <p>Share your culinary masterpiece with the community</p>
      </div>

      {message && <div className={`${styles.message} ${messageType === "success" ? styles.messageSuccess : styles.messageError}`}>{message}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Recipe Basics */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📝 Recipe Basics</h2>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Recipe Name *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="Enter recipe name"
              value={formData.title}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your recipe..."
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
            <h2>⚙️ Recipe Details</h2>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="servings" className={styles.label}>
                Servings
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
                Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className={styles.input}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cuisine" className={styles.label}>
                Cuisine
              </label>
              <input
                id="cuisine"
                type="text"
                name="cuisine"
                placeholder="Italian"
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
            <h2>🥘 Ingredients</h2>
          </div>

          <div className={styles.ingredientForm}>
            <div className={styles.ingredientInputs}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Name"
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
                  placeholder="Qty"
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
                  placeholder="Unit"
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
                  placeholder="Note"
                  value={currentIngredient.note}
                  onChange={(e) =>
                    setCurrentIngredient({ ...currentIngredient, note: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <button type="button" onClick={addIngredient} className={styles.addBtn}>
              + Add
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
            <h2>👨‍🍳 Steps</h2>
          </div>

          <div className={styles.stepForm}>
            <textarea
              placeholder="Enter cooking instruction..."
              value={currentStep.instruction}
              onChange={(e) =>
                setCurrentStep({ ...currentStep, instruction: e.target.value })
              }
              className={styles.textarea}
              rows={2}
            />
            <button type="button" onClick={addStep} className={styles.addBtn}>
              + Add Step
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
            <h2>🏷️ Tags</h2>
          </div>

          <div className={styles.tagsForm}>
            <input
              type="text"
              placeholder="Add a tag..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className={styles.input}
            />
            <button type="button" onClick={addTag} className={styles.addBtn}>
              + Add
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
            {loading ? "Publishing..." : "Publish Recipe"}
          </button>
        </div>
      </form>
    </div>
  );
}