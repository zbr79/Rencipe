"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";
import { useCreateForm } from "../contexts/CreateFormContext";
import PhotoUploadStep from "./components/PhotoUploadStep";
import RecipeBasicsForm from "./components/RecipeBasicsForm";
import IngredientsSection from "./components/IngredientsSection";
import StepsSection from "./components/StepsSection";
import TagsSection from "./components/TagsSection";
import { useDraft } from "../../hooks/useDraft";
import UnsavedChangesModal, { RestoreDraftModal } from "../../components/DraftModals";

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
  const { recipeImage: contextImage, recipeImageFile: contextImageFile, setRecipeImage, setRecipeImageFile } = useCreateForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draft management
  const { draft, draftLoaded, isSaving, hasUnsavedChanges, saveDraft, deleteDraft, updateHasChanges } = useDraft({
    authorId: "507f1f77bcf86cd799439011",
    enabled: true,
  });

  const [showRestoreDraftModal, setShowRestoreDraftModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  // Show restore draft modal when draft is loaded
  useEffect(() => {
    if (draftLoaded && draft && !showPhotoStep) {
      setShowRestoreDraftModal(true);
    }
  }, [draftLoaded, draft, showPhotoStep]);

  // Handle beforeunload (browser back, refresh, tab close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle router changes (navigation to other pages)
  const handleNavigate = (href: string) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => router.push(href));
      setShowUnsavedChangesModal(true);
    } else {
      router.push(href);
    }
  };

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

  // Draft handlers
  const handleRestoreDraft = () => {
    if (!draft) return;
    setFormData({
      title: draft.title,
      description: draft.description,
      authorId: "507f1f77bcf86cd799439011",
      component: draft.component ?? false,
      mainIngredients: draft.mainIngredients || [],
      seasonings: draft.seasonings || [],
      steps: draft.steps || [],
      servings: draft.servings || 1,
      tags: draft.tags || [],
    });
    if (draft.image) setLocalRecipeImage(draft.image);
    if (draft.steps) {
      const images: { [key: number]: string } = {};
      draft.steps.forEach((step) => {
        if (step.image) images[step.stepNumber] = step.image;
      });
      setStepImages(images);
    }
    setShowRestoreDraftModal(false);
  };

  const handleDiscardDraft = () => {
    deleteDraft();
    setShowRestoreDraftModal(false);
  };

  const handleSaveDraftAndLeave = async () => {
    if (hasUnsavedChanges) {
      await saveDraft({
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
    }
    setShowUnsavedChangesModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Auto-save draft when form changes
  useEffect(() => {
    if (!draftLoaded || !formData) return;
    const draftData = {
      title: formData.title,
      description: formData.description,
      image: recipeImage || undefined,
      component: formData.component ?? false,
      mainIngredients: formData.mainIngredients,
      seasonings: formData.seasonings,
      steps: formData.steps,
      servings: formData.servings,
      tags: formData.tags,
    };
    saveDraft(draftData);
  }, [formData, recipeImage, stepImages, tagsInput, draftLoaded, saveDraft]);

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
      console.log("Creating recipe with data:", formData);
      
      const response = await fetch(`/api/recipes`, {
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
      console.log("Recipe created successfully:", recipeId);

      // Upload recipe image if exists
      if (recipeImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", recipeImageFile);
        await fetch(`/api/recipes/${recipeId}/upload-image`, {
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
          await fetch(`/api/recipes/${recipeId}/steps/${stepNumber}/upload-image`, {
            method: "POST",
            body: stepFormData,
          });
        }
      }

      setMessage(`✓ 食谱已创建`);
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
      deleteDraft();

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
      {/* Draft Modals */}
      <RestoreDraftModal
        isOpen={showRestoreDraftModal}
        lastSaved={draft?.updatedAt ? new Date(draft.updatedAt).toLocaleTimeString() : null}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        isSaving={isSaving}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveDraftAndLeave}
      />

      {/* Draft saved indicator */}
      {isSaving && (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
          <div style={{
            backgroundColor: "var(--primary)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}>
            💾 正在保存草稿...
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
            component={formData.component}
            onTitleChange={(value) => setFormData({ ...formData, title: value })}
            onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
            onServingsChange={(value) => setFormData({ ...formData, servings: value })}
            onComponentChange={(value) => setFormData({ ...formData, component: value })}
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
