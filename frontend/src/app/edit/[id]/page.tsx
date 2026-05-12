"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../styles.module.css";
import FloatingActionPanel from "../../components/FloatingActionPanel";
import { useConfirmDialog } from "../../components/ConfirmDialogProvider";
import { toastSuccess } from "../../components/toast/toast";
import RecipeBasicsForm from "../../create/components/RecipeBasicsForm";
import IngredientsSection from "../../create/components/IngredientsSection";
import StepsSection from "../../create/components/StepsSection";
import TagsSection from "../../create/components/TagsSection";
import RecipeOriginSection from "../../create/components/RecipeOriginSection";
import TipsSection from "../../create/components/TipsSection";
import { authFetch, getCurrentUser, type AuthUser } from "../../utils/authSession";

interface Ingredient {
  name: string;
  quantity: string;
}

interface Step {
  stepNumber: number;
  instruction: string;
  image?: string;
}

interface RecipeData {
  id: string;
  title: string;
  description: string;
  tips: string;
  recipeOrigin: "original" | "shared";
  sharedSource: string;
  sharedSourceLink: string;
  authorId: string;
  component: boolean;
  isPublic: boolean;
  image?: string;
  mainIngredients: Ingredient[];
  seasonings: Ingredient[];
  steps: Step[];
  servings: number;
  tags: string[];
}

interface RecipeFormData {
  title: string;
  description: string;
  tips: string;
  authorId: string;
  recipeOrigin: "original" | "shared";
  sharedSource: string;
  sharedSourceLink: string;
  component: boolean;
  isPublic: boolean;
  mainIngredients: Ingredient[];
  seasonings: Ingredient[];
  steps: Step[];
  servings: number;
  tags: string[];
}

const DEFAULT_INGREDIENT_ROWS = 3;

function createEmptyIngredients(count = DEFAULT_INGREDIENT_ROWS): Ingredient[] {
  return Array.from({ length: count }, () => ({ name: "", quantity: "" }));
}

function canEditRecipe(recipe: RecipeData, user: AuthUser | null) {
  return Boolean(user && (user.role === "admin" || recipe.authorId === user.id));
}

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [, setRecipeImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [originalRecipe, setOriginalRecipe] = useState<RecipeData | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [stepImages, setStepImages] = useState<{ [key: number]: string }>({});
  const [stepImageFiles, setStepImageFiles] = useState<{ [key: number]: File }>({});
  const [originalStepImages, setOriginalStepImages] = useState<{ [key: number]: string }>({});

  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    tips: "",
    authorId: "",
    recipeOrigin: "original",
    sharedSource: "",
    sharedSourceLink: "",
    component: false,
    isPublic: false,
    mainIngredients: createEmptyIngredients(),
    seasonings: createEmptyIngredients(),
    steps: [{ stepNumber: 1, instruction: "" }],
    servings: 1,
    tags: [],
  });

  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm, notify } = useConfirmDialog();

  const normalizeRecipeForm = (recipe: RecipeData): RecipeFormData => ({
    title: recipe.title,
    description: recipe.description,
    tips: recipe.tips || "",
    authorId: recipe.authorId,
    recipeOrigin: recipe.recipeOrigin === "shared" ? "shared" : "original",
    sharedSource: recipe.sharedSource || "",
    sharedSourceLink: recipe.sharedSourceLink || "",
    component: recipe.component ?? false,
    isPublic: recipe.isPublic ?? false,
    mainIngredients: recipe.mainIngredients?.length ? recipe.mainIngredients : createEmptyIngredients(),
    seasonings: recipe.seasonings?.length ? recipe.seasonings : createEmptyIngredients(),
    steps: recipe.steps || [{ stepNumber: 1, instruction: "" }],
    servings: recipe.servings || 1,
    tags: recipe.tags || [],
  });

  const getStepImageMap = (steps: Step[] = []) => {
    const images: { [key: number]: string } = {};
    steps.forEach((step) => {
      if (step.image) images[step.stepNumber] = step.image;
    });
    return images;
  };

  // Load recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await authFetch(`/api/recipes/${recipeId}`);

        if (!response.ok) {
          throw new Error("Failed to load recipe");
        }

        const data = await response.json();
        const recipe: RecipeData = data.recipe;
        const user = getCurrentUser();

        setCurrentUser(user);
        if (!canEditRecipe(recipe, user)) {
          setError("You can only edit recipes you created.");
          return;
        }

        const images = getStepImageMap(recipe.steps || []);

        setOriginalRecipe(recipe);
        setOriginalStepImages(images);
        setFormData(normalizeRecipeForm(recipe));
        setRecipeImage(recipe.image || null);
        setRecipeImageFile(null);
        setStepImages(images);
        setStepImageFiles({});

        setTagsInput(recipe.tags.join(", "));
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) fetchRecipe();
  }, [recipeId]);

  const handleRecipeImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      const previousImage = recipeImage;
      const reader = new FileReader();
      reader.onload = (event) => setRecipeImage(event.target?.result as string);
      reader.readAsDataURL(file);
      setRecipeImageFile(null);
      setImageUploading(true);

      try {
        const imageFormData = new FormData();
        imageFormData.append("image", file);

        const response = await authFetch(`/api/recipes/${recipeId}/upload-image`, {
          method: "POST",
          body: imageFormData,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Failed to update cover image");

        const updatedRecipe: RecipeData = data.recipe;
        setRecipeImage(updatedRecipe.image || previousImage);
        setOriginalRecipe((current) => current ? { ...current, image: updatedRecipe.image } : updatedRecipe);
        setRecipeImageFile(null);
      } catch (err: any) {
        setRecipeImage(previousImage);
        await notify({
          title: "Image update failed",
          message: err.message || "Failed to update cover image",
          intent: "danger",
        });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const handleStepImageChange = (e: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      // Store the File object for upload
      setStepImageFiles((prev) => ({ ...prev, [stepNumber]: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setStepImages((prev) => ({
          ...prev,
          [stepNumber]: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addMainIngredient = () => {
    setFormData({
      ...formData,
      mainIngredients: [...formData.mainIngredients, { name: "", quantity: "" }],
    });
  };

  const removeMainIngredient = (index: number) => {
    setFormData({
      ...formData,
      mainIngredients: formData.mainIngredients.filter((_, i) => i !== index),
    });
  };

  const addSeasonings = () => {
    setFormData({
      ...formData,
      seasonings: [...formData.seasonings, { name: "", quantity: "" }],
    });
  };

  const removeSeasonings = (index: number) => {
    setFormData({
      ...formData,
      seasonings: formData.seasonings.filter((_, i) => i !== index),
    });
  };

  const addStep = () => {
    const newStepNumber = Math.max(...formData.steps.map(s => s.stepNumber), 0) + 1;
    setFormData({
      ...formData,
      steps: [...formData.steps, { stepNumber: newStepNumber, instruction: "" }],
    });
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    const nextTag = tagsInput.trim();
    if (!nextTag) return;
    if (!formData.tags.includes(nextTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, nextTag],
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
    // Remove from stepImages display
    setStepImages((prev) => {
      const updated = { ...prev };
      delete updated[stepNumber];
      return updated;
    });
    // Remove from stepImageFiles (for upload)
    setStepImageFiles((prev) => {
      const updated = { ...prev };
      delete updated[stepNumber];
      return updated;
    });
  };

  const handlePublishChange = async (checked: boolean) => {
    if (checked && !formData.isPublic) {
      const approved = await confirm({
        title: "Publish recipe",
        message: "This will make everyone see this recipe. Are you sure?",
        intent: "warning",
        confirmText: "Publish",
      });

      if (!approved) return;
    }

    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleSubmit = async () => {
    if (!originalRecipe || !canEditRecipe(originalRecipe, currentUser)) {
      await notify({
        title: "Editing blocked",
        message: "You can only edit recipes you created.",
        intent: "warning",
      });
      return;
    }

    if (!formData.title.trim()) {
      await notify({
        title: "Recipe name required",
        message: "Please enter a recipe name.",
        intent: "warning",
      });
      return;
    }
    if (!formData.description.trim()) {
      await notify({
        title: "Recipe description required",
        message: "Please enter a recipe description.",
        intent: "warning",
      });
      return;
    }
    if (formData.recipeOrigin === "shared" && !formData.sharedSource.trim()) {
      await notify({
        title: "Shared recipe source required",
        message: "Please enter the source for this shared recipe.",
        intent: "warning",
      });
      return;
    }
    if (imageUploading) {
      await notify({
        title: "Image still saving",
        message: "Please wait for the cover image to finish saving.",
        intent: "neutral",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Update recipe basics
      const updateResponse = await authFetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tips: formData.tips.trim(),
          recipeOrigin: formData.recipeOrigin,
          sharedSource: formData.recipeOrigin === "shared" ? formData.sharedSource.trim() : "",
          sharedSourceLink: formData.recipeOrigin === "shared" ? formData.sharedSourceLink.trim() : "",
          component: formData.component,
          isPublic: formData.isPublic,
          mainIngredients: formData.mainIngredients,
          seasonings: formData.seasonings,
          steps: formData.steps,
          servings: formData.servings,
          tags: formData.tags,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update recipe");
      }

      await updateResponse.json();

      // Upload step images - only upload files that were newly selected
      for (const [stepNumber, file] of Object.entries(stepImageFiles)) {
        const stepFormData = new FormData();
        stepFormData.append("image", file);

        await authFetch(`/api/recipes/${recipeId}/steps/${stepNumber}/upload-image`, {
          method: "POST",
          body: stepFormData,
        });
      }

      const refreshedResponse = await authFetch(`/api/recipes/${recipeId}`);
      if (refreshedResponse.ok) {
        const refreshedData = await refreshedResponse.json();
        const refreshedRecipe: RecipeData = refreshedData.recipe;
        const refreshedStepImages = getStepImageMap(refreshedRecipe.steps || []);
        setOriginalRecipe(refreshedRecipe);
        setOriginalStepImages(refreshedStepImages);
        setRecipeImage(refreshedRecipe.image || recipeImage);
        setRecipeImageFile(null);
        setStepImageFiles({});
      }

      toastSuccess("Recipe updated");
      router.push(`/recipes/${recipeId}`);
    } catch (err: any) {
      await notify({
        title: "Save failed",
        message: `Submit failed: ${err.message || "Unknown error"}`,
        intent: "danger",
      });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!originalRecipe || !canEditRecipe(originalRecipe, currentUser)) {
      await notify({
        title: "Delete blocked",
        message: "You can only delete recipes you created.",
        intent: "warning",
      });
      return;
    }

    if (!(await confirm({
      title: "Delete recipe",
      message: "Delete this recipe? This cannot be undone.",
      intent: "danger",
      confirmText: "Delete",
    }))) return;
    setDeleting(true);
    try {
      const response = await authFetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete recipe");
      router.push("/profile");
    } catch (err: any) {
      await notify({
        title: "Delete failed",
        message: `Delete failed: ${err.message || "Unknown error"}`,
        intent: "danger",
      });
      setDeleting(false);
    }
  };

  const handleRevert = () => {
    if (!originalRecipe) return;
    setFormData(normalizeRecipeForm(originalRecipe));
    setRecipeImage(originalRecipe.image || null);
    setRecipeImageFile(null);
    setStepImages(originalStepImages);
    setStepImageFiles({});
    setTagsInput((originalRecipe.tags || []).join(", "));
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <Link href="/" className={styles.backLink}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.editorHeader}>
        <Link href={`/recipes/${recipeId}`} className={styles.backLink}>
          <span className="material-symbols-outlined">arrow_back</span>
          Recipe
        </Link>
        <div>
          <p className={styles.kicker}>Editing</p>
          <h1 className={styles.title}>{formData.title || "Untitled recipe"}</h1>
        </div>
      </div>

      <FloatingActionPanel
        ariaLabel="Edit recipe actions"
        toggleOpenLabel="Open edit actions"
        toggleCloseLabel="Minimize edit actions"
        actions={[
          {
            id: "save",
            icon: "save",
            label: submitting ? "Saving recipe" : "Save recipe",
            onClick: handleSubmit,
            disabled: submitting || imageUploading,
            tone: "primary",
          },
          {
            id: "revert",
            icon: "history",
            label: "Revert changes",
            onClick: handleRevert,
            disabled: !originalRecipe || submitting,
          },
          {
            id: "delete",
            icon: "delete",
            label: deleting ? "Deleting recipe" : "Delete recipe",
            onClick: handleDelete,
            disabled: deleting,
            tone: "danger",
          },
        ]}
      />

      {recipeImage ? (
        <div className={styles.coverImageSection}>
          <button
            type="button"
            className={`${styles.imageDisplay} ${styles.imageDisplayButton}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUploading}
            aria-label={imageUploading ? "Saving cover image" : "Replace cover image"}
            title={imageUploading ? "Saving cover image" : "Replace cover image"}
          >
            <img
              src={recipeImage}
              alt="Recipe cover"
              className={styles.recipeImage}
            />
            <span className={styles.replaceImageIconButton} aria-hidden="true">
              <span className="material-symbols-outlined">autorenew</span>
            </span>
            {imageUploading && <span className={styles.imageSavingBadge}>Saving...</span>}
          </button>

          <div className={styles.coverActionsRow}>
            <p className={styles.uploadPromptText}>Cover image</p>
            <button
              type="button"
              className={styles.uploadPromptBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
            >
              {imageUploading ? "Saving cover" : "Change cover"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.uploadPrompt}>
          <p className={styles.uploadPromptText}>Cover image</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadPromptBtn}
            disabled={imageUploading}
          >
            {imageUploading ? "Saving cover" : "Add cover"}
          </button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className={styles.form}>
        <RecipeBasicsForm
          title={formData.title}
          description={formData.description}
          servings={formData.servings}
          isPublic={formData.isPublic}
          publishDisabled={submitting || imageUploading}
          onTitleChange={(title) => setFormData({ ...formData, title })}
          onDescriptionChange={(description) => setFormData({ ...formData, description })}
          onServingsChange={(servings) => setFormData({ ...formData, servings })}
          onPublishChange={handlePublishChange}
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

        <RecipeOriginSection
          recipeOrigin={formData.recipeOrigin}
          sharedSource={formData.sharedSource}
          sharedSourceLink={formData.sharedSourceLink}
          onRecipeOriginChange={(recipeOrigin: "original" | "shared") => setFormData({ ...formData, recipeOrigin })}
          onSharedSourceChange={(sharedSource) => setFormData({ ...formData, sharedSource })}
          onSharedSourceLinkChange={(sharedSourceLink) => setFormData({ ...formData, sharedSourceLink })}
        />

        <TipsSection
          tips={formData.tips}
          onTipsChange={(tips) => setFormData({ ...formData, tips })}
        />

        <div className={styles.submitContainer}>
          <button
            type="submit"
            disabled={submitting || imageUploading}
            className={styles.submitBtn}
          >
            {submitting ? "Submitting..." : "Save Changes"}
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
  );
}
