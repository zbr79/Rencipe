"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { useCreateForm } from "../contexts/CreateFormContext";
import PhotoUploadStep from "./components/PhotoUploadStep";
import RecipeBasicsForm from "./components/RecipeBasicsForm";
import IngredientsSection from "./components/IngredientsSection";
import StepsSection from "./components/StepsSection";
import TagsSection from "./components/TagsSection";

interface Ingredient {
  name: string;
  quantity: string;
}

interface Step {
  stepNumber: number;
  instruction: string;
  image?: string;
}

export default function CreatePage() {
  const { recipeImage: contextImage, recipeImageFile: contextImageFile, setRecipeImage, setRecipeImageFile } = useCreateForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPhotoStep, setShowPhotoStep] = useState(false);
  const [recipeImage, setLocalRecipeImage] = useState<string | null>(contextImage);
  const [recipeImageFile, setLocalRecipeImageFile] = useState<File | null>(contextImageFile);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    authorId: "507f1f77bcf86cd799439011",
    ingredients: [
      {
        name: "",
        quantity: "",
      },
    ] as Ingredient[],
    steps: [
      {
        stepNumber: 1,
        instruction: "",
      },
    ] as Step[],
    servings: 1,
    tags: [] as string[],
  });

  useEffect(() => {
    if (contextImage) {
      setLocalRecipeImage(contextImage);
    }
    if (contextImageFile) {
      setLocalRecipeImageFile(contextImageFile);
    }
  }, [contextImage, contextImageFile]);

  const [stepImages, setStepImages] = useState<{ [key: number]: string }>({});
  const [stepImageFiles, setStepImageFiles] = useState<{ [key: number]: File }>({});

  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const handleRecipeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalRecipeImageFile(file);
      setRecipeImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setLocalRecipeImage(imageData);
        setRecipeImage(imageData);
        // Move to form step after photo is selected
        setShowPhotoStep(false);
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
    setFormData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { name: "", quantity: "" }],
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), { stepNumber: (prev.steps?.length || 0) + 1, instruction: "" }],
    }));
  };

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (!tagsInput.trim()) return;
    if (!formData.tags.includes(tagsInput)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagsInput],
      }));
    }
    setTagsInput("");
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const removeStepImage = (stepNumber: number) => {
    setStepImages((prev) => {
      const updated = { ...prev };
      delete updated[stepNumber];
      return updated;
    });
    setStepImageFiles((prev) => {
      const updated = { ...prev };
      delete updated[stepNumber];
      return updated;
    });
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
    <>
      {showPhotoStep && (
        <div className={styles.modalOverlay}>
          <PhotoUploadStep
            recipeImage={recipeImage}
            onImageChange={handleRecipeImageChange}
            onContinue={() => setShowPhotoStep(false)}
          />
        </div>
      )}

      <div className={styles.container} style={{ opacity: showPhotoStep ? 0.3 : 1, pointerEvents: showPhotoStep ? "none" : "auto" }}>
        {recipeImage && (
          <div className={styles.imageDisplay}>
            <img 
              src={recipeImage} 
              alt="Recipe cover" 
              className={styles.recipeImage}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                height: "420px",
                objectFit: "cover",
                display: "block",
                cursor: "pointer",
              } as React.CSSProperties}
            />
          </div>
        )}

        {message && (
          <div className={`${styles.message} ${messageType === "success" ? styles.messageSuccess : styles.messageError}`}>
            {message}
          </div>
        )}

        {!recipeImage && (
          <div className={styles.uploadPrompt}>
            <p className={styles.uploadPromptText}>先上传封面图片再开始</p>
            <button
              type="button"
              onClick={() => setShowPhotoStep(true)}
              className={styles.uploadPromptBtn}
            >
              📸 上传图片
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <RecipeBasicsForm
            title={formData.title}
            description={formData.description}
            servings={formData.servings}
            onTitleChange={(value) => setFormData({ ...formData, title: value })}
            onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
            onServingsChange={(value) => setFormData({ ...formData, servings: value })}
          />

          <IngredientsSection
            ingredients={formData.ingredients}
            onIngredientsChange={(ingredients) => setFormData({ ...formData, ingredients })}
            onAddIngredient={addIngredient}
            onRemoveIngredient={removeIngredient}
          />

          <StepsSection
            steps={formData.steps}
            stepImages={stepImages}
            onStepsChange={(steps) => setFormData({ ...formData, steps })}
            onStepImageChange={handleStepImageChange}
            onAddStep={addStep}
            onRemoveStep={removeStep}
            onRemoveStepImage={removeStepImage}
          />

          <TagsSection
            tags={formData.tags}
            tagsInput={tagsInput}
            onTagsInputChange={setTagsInput}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />

          <div className={styles.submitContainer}>
            <button type="submit" disabled={loading || !recipeImage} className={styles.submitBtn}>
              {loading ? "提交中..." : "创建食谱"}
            </button>
          </div>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleRecipeImageChange}
        />
      </div>
    </>
  );
}
