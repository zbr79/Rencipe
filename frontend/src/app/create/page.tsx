"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles.module.css";
import { useCreateForm } from "../contexts/CreateFormContext";
import PhotoUploadStep from "./components/PhotoUploadStep";
import RecipeBasicsForm from "./components/RecipeBasicsForm";
import IngredientsSection from "./components/IngredientsSection";
import StepsSection from "./components/StepsSection";
import TagsSection from "./components/TagsSection";
import { useDraft } from "../../hooks/useDraft";
import { getHealthTag, withHealthTag } from "../utils/recipeTags";
import { authFetch } from "../utils/authSession";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const { recipeImage: contextImage, recipeImageFile: contextImageFile, setRecipeImage, setRecipeImageFile } = useCreateForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft management
  const { draft, draftLoaded, isSaving, lastSaved, saveDraft, deleteDraft } = useDraft({
    authorId: "507f1f77bcf86cd799439011",
    draftId: draftId || undefined,
    enabled: true,
  });

  const [draftName, setDraftName] = useState("Untitled Draft");

  const [showPhotoStep, setShowPhotoStep] = useState(false);
  const [recipeImage, setLocalRecipeImage] = useState<string | null>(contextImage);
  const [recipeImageFile, setLocalRecipeImageFile] = useState<File | null>(contextImageFile);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    authorId: "507f1f77bcf86cd799439011",
    component: false,
    mainIngredients: [
      {
        name: "",
        quantity: "",
      },
    ] as Ingredient[],
    seasonings: [
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

  // Load draft data if draftId is provided
  useEffect(() => {
    if (draftLoaded && draft && draftId) {
      setFormData({
        title: draft.title || "",
        description: draft.description || "",
        authorId: "507f1f77bcf86cd799439011",
        component: draft.component ?? false,
        mainIngredients: draft.mainIngredients || [],
        seasonings: draft.seasonings || [],
        steps: draft.steps || [],
        servings: draft.servings || 1,
        tags: draft.tags || [],
      });
      if (draft.image) setLocalRecipeImage(draft.image);
      if (draft.name) setDraftName(draft.name);
    }
  }, [draftLoaded, draft, draftId]);

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

  const hasDraftContent = () => {
    return Boolean(
      formData.title.trim() ||
      formData.description.trim() ||
      recipeImage ||
      formData.tags.length > 0 ||
      formData.mainIngredients.some((ingredient) => ingredient.name.trim() || ingredient.quantity.trim()) ||
      formData.seasonings.some((ingredient) => ingredient.name.trim() || ingredient.quantity.trim()) ||
      formData.steps.some((step) => step.instruction.trim())
    );
  };

  const getDraftData = () => ({
    title: formData.title,
    description: formData.description,
    image: recipeImage || undefined,
    component: formData.component ?? false,
    mainIngredients: formData.mainIngredients,
    seasonings: formData.seasonings,
    steps: formData.steps,
    servings: formData.servings,
    tags: formData.tags,
  });

  const getDraftName = () => formData.title.trim() || draftName || "Untitled Draft";

  const handleManualSaveDraft = async () => {
    if (!hasDraftContent()) {
      setMessage("Add a title, ingredient, step, or cover image before saving a draft.");
      setMessageType("error");
      return;
    }

    const savedDraft = await saveDraft(getDraftData(), getDraftName(), { immediate: true });
    if (savedDraft) {
      setDraftName(savedDraft.name || getDraftName());
      setMessage("Draft saved to My Drafts.");
      setMessageType("success");
    } else {
      setMessage("Draft could not be saved. Please try again.");
      setMessageType("error");
    }
  };

  // Auto-save draft when form changes
  useEffect(() => {
    if (!draftLoaded || !formData) return;
    if (!hasDraftContent()) return;
    saveDraft(getDraftData(), getDraftName());
  }, [formData, recipeImage, stepImages, tagsInput, draftLoaded, saveDraft, draftName]);

  const addMainIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      mainIngredients: [...(prev.mainIngredients || []), { name: "", quantity: "" }],
    }));
  };

  const removeMainIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      mainIngredients: prev.mainIngredients.filter((_, i) => i !== index),
    }));
  };

  const addSeasonings = () => {
    setFormData((prev) => ({
      ...prev,
      seasonings: [...(prev.seasonings || []), { name: "", quantity: "" }],
    }));
  };

  const removeSeasonings = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      seasonings: prev.seasonings.filter((_, i) => i !== index),
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

  const handleHealthTagChange = (healthTag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: withHealthTag(prev.tags, healthTag),
    }));
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
      if (!recipeImage) {
        setMessage("Add a cover image before publishing this recipe.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      console.log("Creating recipe with data:", formData);
      
      const response = await authFetch(`/api/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          image: recipeImageFile ? undefined : recipeImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create recipe");
      }

      const data = await response.json();
      const recipeId = data.recipe.id;
      console.log("Recipe created successfully:", recipeId);

      // Upload recipe image if exists
      if (recipeImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", recipeImageFile);
        await authFetch(`/api/recipes/${recipeId}/upload-image`, {
          method: "POST",
          body: imageFormData,
        });
      }

      // Upload step images if exist
      const stepNumbers = Object.keys(stepImageFiles);
      console.log("Uploading step images for steps:", stepNumbers);
      for (const stepNumber of stepNumbers) {
        const file = stepImageFiles[Number(stepNumber)];
        if (file) {
          const stepFormData = new FormData();
          stepFormData.append("image", file);
          await authFetch(`/api/recipes/${recipeId}/steps/${stepNumber}/upload-image`, {
            method: "POST",
            body: stepFormData,
          });
        }
      }

      setMessage(`Recipe created successfully`);
      setMessageType("success");

      setFormData({
        title: "",
        description: "",
        authorId: "507f1f77bcf86cd799439011",
        component: false,
        mainIngredients: [],
        seasonings: [],
        steps: [],
        servings: 1,
        tags: [],
      });
      setRecipeImage(null);
      setRecipeImageFile(null);
      setStepImages({});
      setStepImageFiles({});

      // Delete draft after successful creation
      await deleteDraft();

      setTimeout(() => {
        window.location.href = `/recipes/${recipeId}`;
      }, 1500);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      setMessage(`✗ ${error.message || String(error)}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Draft saved indicator */}
      {(isSaving || lastSaved) && (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
          <div style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--text-secondary)",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            fontSize: "12px",
            boxShadow: "var(--shadow-sm)",
          }}>
            {isSaving ? "Saving draft..." : `Draft saved ${lastSaved}`}
          </div>
        </div>
      )}

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
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Create</p>
            <h1>Create Recipe</h1>
            <p>Start with the recipe details. Add a cover image before publishing.</p>
          </div>
          <button type="button" className={styles.saveDraftBtn} onClick={handleManualSaveDraft} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
        </header>

        {recipeImage && (
          <div className={styles.imageDisplay}>
            <img 
              src={recipeImage} 
              alt="Recipe cover" 
              className={styles.recipeImage}
              onClick={() => fileInputRef.current?.click()}
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
            <p className={styles.uploadPromptText}>Cover image required before publishing</p>
            <button
              type="button"
              onClick={() => setShowPhotoStep(true)}
              className={styles.uploadPromptBtn}
            >
              Add cover
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <RecipeBasicsForm
            title={formData.title}
            description={formData.description}
            servings={formData.servings}
            component={formData.component}
            healthTag={getHealthTag(formData.tags)}
            onTitleChange={(value) => setFormData({ ...formData, title: value })}
            onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
            onServingsChange={(value) => setFormData({ ...formData, servings: value })}
            onComponentChange={(value) => setFormData({ ...formData, component: value })}
            onHealthTagChange={handleHealthTagChange}
          />

          <IngredientsSection
            mainIngredients={formData.mainIngredients}
            seasonings={formData.seasonings}
            onMainIngredientsChange={(mainIngredients) => setFormData({ ...formData, mainIngredients })}
            onSeasoningsChange={(seasonings) => setFormData({ ...formData, seasonings })}
            onAddMainIngredient={addMainIngredient}
            onRemoveMainIngredient={removeMainIngredient}
            onAddSeasonings={addSeasonings}
            onRemoveSeasonings={removeSeasonings}
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
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Submitting..." : "Create Recipe"}
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
