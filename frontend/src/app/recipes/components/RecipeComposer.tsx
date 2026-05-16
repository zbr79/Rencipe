"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./RecipeComposer.module.css";
import { useCreateForm } from "../../contexts/CreateFormContext";
import BackButton from "../../components/BackButton";
import FloatingActionPanel from "../../components/FloatingActionPanel";
import RecipeBasicsForm from "../../create/components/RecipeBasicsForm";
import IngredientsSection from "../../create/components/IngredientsSection";
import StepsSection from "../../create/components/StepsSection";
import TagsSection from "../../create/components/TagsSection";
import RecipeOriginSection from "../../create/components/RecipeOriginSection";
import TipsSection from "../../create/components/TipsSection";
import { useConfirmDialog } from "../../components/ConfirmDialogProvider";
import { toastError, toastSuccess } from "../../components/toast/toast";
import { useDraft } from "../../../hooks/useDraft";
import { authFetch, getCurrentUser, getCurrentUserId, type AuthUser } from "../../utils/authSession";
import {
  EMPTY_CREATE_VALIDATION,
  buildRecipeUpdatePayload,
  canEditRecipe,
  createEmptyIngredients,
  createInitialFormData,
  getCreateValidationLabels,
  getCreateValidationState,
  getEditValidationMessage,
  getRecipeUpdateSignature,
  getStepImageMap,
  normalizeRecipeForm,
  type EditSaveState,
  type RecipeComposerProps,
  type RecipeData,
  type RecipeFormData,
  type RecipeOrigin,
} from "./recipeComposerModel";

export default function RecipeComposer({ mode, draftId, recipeId }: RecipeComposerProps) {
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const router = useRouter();
  const { confirm, notify } = useConfirmDialog();
  const {
    recipeImage: contextRecipeImage,
    recipeImageFile: contextRecipeImageFile,
    setRecipeImage: setContextRecipeImage,
    setRecipeImageFile: setContextRecipeImageFile,
  } = useCreateForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accountId, setAccountId] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [draftName, setDraftName] = useState("Untitled Draft");
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [recipeImage, setRecipeImage] = useState<string | null>(isCreateMode ? contextRecipeImage : null);
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(isCreateMode ? contextRecipeImageFile : null);
  const [originalRecipe, setOriginalRecipe] = useState<RecipeData | null>(null);
  const [originalStepImages, setOriginalStepImages] = useState<{ [key: number]: string }>({});
  const [formData, setFormData] = useState<RecipeFormData>(() => createInitialFormData());
  const [stepImages, setStepImages] = useState<{ [key: number]: string }>({});
  const [stepImageFiles, setStepImageFiles] = useState<{ [key: number]: File }>({});
  const [tagsInput, setTagsInput] = useState("");
  const [persistingEdit, setPersistingEdit] = useState(false);
  const [stepImageUploadingCount, setStepImageUploadingCount] = useState(0);
  const [editSaveState, setEditSaveState] = useState<EditSaveState>("idle");
  const [editSaveMessage, setEditSaveMessage] = useState("");
  const [showCreateValidation, setShowCreateValidation] = useState(false);
  const editAutosaveTimerRef = useRef<number | null>(null);
  const lastSavedEditSignatureRef = useRef("");

  const { draft, draftLoaded, isSaving, lastSaved, saveDraft, deleteDraft } = useDraft({
    authorId: accountId,
    draftId: isCreateMode ? draftId : undefined,
    enabled: isCreateMode && Boolean(accountId),
  });

  useEffect(() => {
    const user = getCurrentUser();
    const userId = user?.id || getCurrentUserId();

    setCurrentUser(user);
    setAccountId(userId);
    setFormData((prev) => {
      if (prev.authorId === userId) {
        return prev;
      }
      return { ...prev, authorId: userId };
    });
  }, []);

  useEffect(() => {
    if (!isCreateMode) {
      return;
    }

    if (contextRecipeImage) {
      setRecipeImage(contextRecipeImage);
    }
    if (contextRecipeImageFile) {
      setRecipeImageFile(contextRecipeImageFile);
    }
  }, [isCreateMode, contextRecipeImage, contextRecipeImageFile]);

  useEffect(() => {
    if (!isCreateMode || !draftLoaded || !draft || !draftId) {
      return;
    }

    setFormData({
      title: draft.title || "",
      description: draft.description || "",
      tips: draft.tips || "",
      authorId: accountId,
      recipeOrigin: draft.recipeOrigin === "shared" ? "shared" : "original",
      sharedSource: draft.sharedSource || "",
      sharedSourceLink: draft.sharedSourceLink || "",
      component: draft.component ?? false,
      isPublic: draft.isPublic ?? false,
      mainIngredients: draft.mainIngredients?.length ? draft.mainIngredients : createEmptyIngredients(),
      seasonings: draft.seasonings?.length ? draft.seasonings : createEmptyIngredients(),
      steps: draft.steps?.length ? draft.steps : [{ stepNumber: 1, instruction: "" }],
      servings: draft.servings || 1,
      tags: draft.tags || [],
    });

    if (draft.image) {
      setRecipeImage(draft.image);
    }
    if (draft.name) {
      setDraftName(draft.name);
    }
  }, [accountId, draft, draftId, draftLoaded, isCreateMode]);

  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    if (!recipeId) {
      setError("Recipe not found.");
      setLoading(false);
      return;
    }

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
        const images = getStepImageMap(recipe.steps || []);

        setCurrentUser(user);
        if (!canEditRecipe(recipe, user)) {
          setError("You can only edit recipes you created.");
          return;
        }

        const normalizedRecipe = normalizeRecipeForm(recipe);
        const signature = getRecipeUpdateSignature(normalizedRecipe, images);

        setOriginalRecipe(recipe);
        setOriginalStepImages(images);
        lastSavedEditSignatureRef.current = signature;
        setEditSaveState("saved");
        setEditSaveMessage("All changes saved.");
        setFormData(normalizedRecipe);
        setRecipeImage(recipe.image || null);
        setRecipeImageFile(null);
        setStepImages(images);
        setStepImageFiles({});
        setTagsInput("");
      } catch (err: any) {
        setError(err.message || "Failed to load recipe");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchRecipe();
  }, [isEditMode, recipeId]);

  const hasDraftContent = () => {
    return Boolean(
      formData.title.trim() ||
      formData.description.trim() ||
      formData.recipeOrigin === "shared" ||
      formData.sharedSource.trim() ||
      formData.sharedSourceLink.trim() ||
      formData.tips.trim() ||
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
    recipeOrigin: formData.recipeOrigin,
    sharedSource: formData.sharedSource,
    sharedSourceLink: formData.sharedSourceLink,
    tips: formData.tips,
    image: recipeImage || undefined,
    component: formData.component ?? false,
    isPublic: formData.isPublic ?? false,
    mainIngredients: formData.mainIngredients,
    seasonings: formData.seasonings,
    steps: formData.steps,
    servings: formData.servings,
    tags: formData.tags,
  });

  const getDraftName = () => formData.title.trim() || draftName || "Untitled Draft";

  const handleManualSaveDraft = async () => {
    if (!hasDraftContent()) {
      toastError("Add a title, ingredient, step, or cover image before saving a draft.");
      return;
    }

    const savedDraft = await saveDraft(getDraftData(), getDraftName(), { immediate: true });
    if (savedDraft) {
      setDraftName(savedDraft.name || getDraftName());
      toastSuccess("Draft saved to My Drafts.");
      return;
    }

    toastError("Draft could not be saved. Please try again.");
  };

  const handleRecipeImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (isCreateMode) {
      setRecipeImageFile(file);
      setContextRecipeImageFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        setRecipeImage(imageData);
        setContextRecipeImage(imageData);
      };
      reader.readAsDataURL(file);
      return;
    }

    const previousImage = recipeImage;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setRecipeImage(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
    setRecipeImageFile(null);
    setImageUploading(true);
    setEditSaveState("saving");
    setEditSaveMessage("Saving cover image...");

    try {
      const imageFormData = new FormData();
      imageFormData.append("image", file);

      const response = await authFetch(`/api/recipes/${recipeId}/upload-image`, {
        method: "POST",
        body: imageFormData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update cover image");
      }

      const updatedRecipe: RecipeData = data.recipe;
      setRecipeImage(updatedRecipe.image || previousImage);
      setRecipeImageFile(null);
      setEditSaveState("saved");
      setEditSaveMessage("Cover image saved.");
    } catch (err: any) {
      setRecipeImage(previousImage);
      setEditSaveState("error");
      setEditSaveMessage(err.message || "Could not save cover image.");
      toastError(err.message || "Could not save cover image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleStepImageChange = async (event: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setStepImages((prev) => ({
        ...prev,
        [stepNumber]: loadEvent.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);

    if (isCreateMode) {
      setStepImageFiles((prev) => ({ ...prev, [stepNumber]: file }));
      return;
    }

    const previousImage = stepImages[stepNumber];
    setStepImageUploadingCount((current) => current + 1);
    setEditSaveState("saving");
    setEditSaveMessage(`Saving image for step ${stepNumber}...`);

    try {
      const stepFormData = new FormData();
      stepFormData.append("image", file);

      const response = await authFetch(`/api/recipes/${recipeId}/steps/${stepNumber}/upload-image`, {
        method: "POST",
        body: stepFormData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update step image");
      }

      const updatedRecipe: RecipeData = data.recipe;
      const updatedStepImages = getStepImageMap(updatedRecipe.steps || []);
      const nextImage = updatedStepImages[stepNumber];

      setStepImages((prev) => {
        const updated = { ...prev };
        if (nextImage) {
          updated[stepNumber] = nextImage;
        } else {
          delete updated[stepNumber];
        }
        return updated;
      });
      setFormData((prev) => ({
        ...prev,
        steps: prev.steps.map((step) => (step.stepNumber === stepNumber ? { ...step, image: nextImage || undefined } : step)),
      }));
      setEditSaveState("saved");
      setEditSaveMessage(`Step ${stepNumber} image saved.`);
    } catch (err: any) {
      setStepImages((prev) => {
        const updated = { ...prev };
        if (previousImage) {
          updated[stepNumber] = previousImage;
        } else {
          delete updated[stepNumber];
        }
        return updated;
      });
      setEditSaveState("error");
      setEditSaveMessage(err.message || `Could not save step ${stepNumber} image.`);
      toastError(err.message || `Could not save step ${stepNumber} image`);
    } finally {
      setStepImageUploadingCount((current) => Math.max(0, current - 1));
    }
  };

  useEffect(() => {
    if (!isCreateMode || !draftLoaded) {
      return;
    }
    if (!hasDraftContent()) {
      return;
    }
    void saveDraft(getDraftData(), getDraftName());
  }, [draftLoaded, draftName, formData, isCreateMode, recipeImage, saveDraft, stepImages, tagsInput]);

  const addMainIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      mainIngredients: [...(prev.mainIngredients || []), { name: "", quantity: "" }],
    }));
  };

  const removeMainIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      mainIngredients: prev.mainIngredients.filter((_, itemIndex) => itemIndex !== index),
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
      seasonings: prev.seasonings.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addStep = () => {
    if (isCreateMode) {
      setFormData((prev) => ({
        ...prev,
        steps: [...(prev.steps || []), { stepNumber: (prev.steps?.length || 0) + 1, instruction: "" }],
      }));
      return;
    }

    setFormData((prev) => {
      const newStepNumber = Math.max(...prev.steps.map((step) => step.stepNumber), 0) + 1;
      return {
        ...prev,
        steps: [...prev.steps, { stepNumber: newStepNumber, instruction: "" }],
      };
    });
  };

  const removeStep = (index: number) => {
    const removedStepNumber = formData.steps[index]?.stepNumber;

    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, itemIndex) => itemIndex !== index),
    }));

    if (removedStepNumber) {
      setStepImages((prev) => {
        const updated = { ...prev };
        delete updated[removedStepNumber];
        return updated;
      });
      setStepImageFiles((prev) => {
        const updated = { ...prev };
        delete updated[removedStepNumber];
        return updated;
      });
    }
  };

  const addTag = () => {
    const nextTag = tagsInput.trim();
    if (!nextTag) {
      return;
    }
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
      tags: prev.tags.filter((_, itemIndex) => itemIndex !== index),
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
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.stepNumber === stepNumber ? { ...step, image: undefined } : step)),
    }));
  };

  const handlePublishChange = async (checked: boolean) => {
    if (checked && !formData.isPublic) {
      const approved = await confirm({
        title: "Publish recipe",
        message: "This will make everyone see this recipe. Are you sure?",
        intent: "warning",
        confirmText: "Publish",
      });

      if (!approved) {
        return;
      }
    }

    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const persistEditRecipe = async ({
    nextFormData,
    nextStepImages,
    includeImage = false,
    nextRecipeImage = recipeImage,
    successMessage,
    statusMessage = "All changes saved.",
    errorMessage,
  }: {
    nextFormData: RecipeFormData;
    nextStepImages: { [key: number]: string };
    includeImage?: boolean;
    nextRecipeImage?: string | null;
    successMessage?: string;
    statusMessage?: string;
    errorMessage?: string;
  }) => {
    if (!recipeId) {
      return false;
    }

    setPersistingEdit(true);

    try {
      const response = await authFetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildRecipeUpdatePayload(nextFormData, nextStepImages, {
            includeImage,
            recipeImage: nextRecipeImage,
          })
        ),
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => null);
        throw new Error(responseError?.error || "Failed to update recipe");
      }

      await response.json().catch(() => null);
      lastSavedEditSignatureRef.current = getRecipeUpdateSignature(nextFormData, nextStepImages);
      setEditSaveState("saved");
      setEditSaveMessage(statusMessage);

      if (successMessage) {
        toastSuccess(successMessage);
      }

      return true;
    } catch (err: any) {
      const nextMessage = err.message || errorMessage || "Could not save recipe changes.";
      setEditSaveState("error");
      setEditSaveMessage(nextMessage);
      toastError(nextMessage);
      return false;
    } finally {
      setPersistingEdit(false);
    }
  };

  const handleCreateSubmit = async () => {
    const createValidation = getCreateValidationState(formData, recipeImage);
    const missingFields = getCreateValidationLabels(createValidation);

    if (missingFields.length > 0) {
      setShowCreateValidation(true);
      toastError(`Fill required fields: ${missingFields.join(", ")}.`);
      return;
    }

    if (formData.recipeOrigin === "shared" && !formData.sharedSource.trim()) {
      toastError("Enter the source for this shared recipe.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authFetch(`/api/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sharedSource: formData.recipeOrigin === "shared" ? formData.sharedSource.trim() : "",
          sharedSourceLink: formData.recipeOrigin === "shared" ? formData.sharedSourceLink.trim() : "",
          tips: formData.tips.trim(),
          isPublic: formData.isPublic,
          image: recipeImageFile ? undefined : recipeImage,
        }),
      });

      if (!response.ok) {
        const responseError = await response.json().catch(() => null);
        throw new Error(responseError?.error || "Failed to create recipe");
      }

      const data = await response.json();
      const createdRecipeId = data.recipe.id;

      if (recipeImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", recipeImageFile);
        await authFetch(`/api/recipes/${createdRecipeId}/upload-image`, {
          method: "POST",
          body: imageFormData,
        });
      }

      for (const [stepNumber, file] of Object.entries(stepImageFiles)) {
        const stepFormData = new FormData();
        stepFormData.append("image", file);
        await authFetch(`/api/recipes/${createdRecipeId}/steps/${stepNumber}/upload-image`, {
          method: "POST",
          body: stepFormData,
        });
      }

      toastSuccess("Recipe created successfully.");
  setShowCreateValidation(false);
      setFormData(createInitialFormData(accountId));
  setDraftName("Untitled Draft");
      setRecipeImage(null);
      setRecipeImageFile(null);
      setContextRecipeImage(null);
      setContextRecipeImageFile(null);
      setStepImages({});
      setStepImageFiles({});
  setTagsInput("");
      await deleteDraft();

      window.setTimeout(() => {
        router.push(`/recipes/${createdRecipeId}`);
      }, 1500);
    } catch (submitError: any) {
      console.error("Error in handleCreateSubmit:", submitError);
      toastError(submitError.message || String(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isCreateMode) {
      await handleCreateSubmit();
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

    const approved = await confirm({
      title: "Delete recipe",
      message: "Move this recipe to Trash for 7 days?",
      intent: "danger",
      confirmText: "Delete",
    });
    if (!approved) {
      return;
    }

    if (editAutosaveTimerRef.current) {
      window.clearTimeout(editAutosaveTimerRef.current);
      editAutosaveTimerRef.current = null;
    }

    setDeleting(true);
    try {
      const response = await authFetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to move recipe to trash");
      }
      toastSuccess("Moved to Trash");
      router.push("/my-work?kind=trash");
    } catch (deleteError: any) {
      await notify({
        title: "Delete failed",
        message: `Delete failed: ${deleteError.message || "Unknown error"}`,
        intent: "danger",
      });
      setDeleting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (editAutosaveTimerRef.current) {
        window.clearTimeout(editAutosaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || !originalRecipe || loading || !recipeId) {
      return;
    }

    if (persistingEdit || deleting || imageUploading || stepImageUploadingCount > 0) {
      return;
    }

    const nextSignature = getRecipeUpdateSignature(formData, stepImages);
    if (nextSignature === lastSavedEditSignatureRef.current) {
      if (editSaveState === "saving") {
        setEditSaveState("saved");
        setEditSaveMessage("All changes saved.");
      }
      return;
    }

    const validationMessage = getEditValidationMessage(formData);
    if (validationMessage) {
      setEditSaveState("blocked");
      setEditSaveMessage(validationMessage);
      return;
    }

    setEditSaveState("saving");
    setEditSaveMessage("Saving changes...");

    const timeoutId = window.setTimeout(() => {
      void persistEditRecipe({
        nextFormData: formData,
        nextStepImages: stepImages,
      });
    }, 800);

    editAutosaveTimerRef.current = timeoutId;

    return () => {
      window.clearTimeout(timeoutId);
      if (editAutosaveTimerRef.current === timeoutId) {
        editAutosaveTimerRef.current = null;
      }
    };
  }, [
    deleting,
    editSaveState,
    formData,
    imageUploading,
    isEditMode,
    loading,
    originalRecipe,
    persistingEdit,
    recipeId,
    stepImageUploadingCount,
    stepImages,
  ]);

  const handleRevert = async () => {
    if (!originalRecipe) {
      return;
    }

    if (persistingEdit || imageUploading || stepImageUploadingCount > 0) {
      toastError("Wait for the current recipe changes to finish saving.");
      return;
    }

    const revertedFormData = normalizeRecipeForm(originalRecipe);
    const revertedStepImages = { ...originalStepImages };
    const revertedRecipeImage = originalRecipe.image || null;
    const reverted = await persistEditRecipe({
      nextFormData: revertedFormData,
      nextStepImages: revertedStepImages,
      includeImage: true,
      nextRecipeImage: revertedRecipeImage,
      successMessage: "Reverted recipe changes",
      statusMessage: "Original version restored.",
      errorMessage: "Could not revert recipe changes.",
    });

    if (!reverted) {
      return;
    }

    setFormData(revertedFormData);
    setRecipeImage(revertedRecipeImage);
    setRecipeImageFile(null);
    setStepImages(revertedStepImages);
    setStepImageFiles({});
    setTagsInput("");
  };

  if (isEditMode && loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (isEditMode && error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <BackButton fallbackHref="/" className={styles.backLink} />
        </div>
      </div>
    );
  }

  const stepImageUploading = stepImageUploadingCount > 0;
  const actionBusy = isCreateMode ? submitting || imageUploading : deleting || persistingEdit || imageUploading || stepImageUploading;
  const publishBusy = isCreateMode ? submitting || imageUploading : imageUploading || stepImageUploading;
  const createValidation = getCreateValidationState(formData, recipeImage);
  const activeCreateValidation = isCreateMode && showCreateValidation ? createValidation : EMPTY_CREATE_VALIDATION;
  const editReadyToLeave = Boolean(
    isEditMode &&
    recipeId &&
    editSaveState === "saved" &&
    !deleting &&
    !persistingEdit &&
    !imageUploading &&
    !stepImageUploading
  );
  const editStatusLabel = deleting
    ? "Moving to Trash"
    : persistingEdit || imageUploading || stepImageUploading
      ? "Saving"
      : editSaveState === "error"
        ? "Save failed"
        : editSaveState === "blocked"
          ? "Keep editing"
          : "";
  const showEditStatusButton = Boolean(editStatusLabel);
  const hasRevertableRecipeChanges = originalRecipe
    ? getRecipeUpdateSignature(formData, stepImages) !== getRecipeUpdateSignature(normalizeRecipeForm(originalRecipe), originalStepImages)
      || (recipeImage || "") !== (originalRecipe.image || "")
    : false;

  return (
    <>
      {isCreateMode && (isSaving || lastSaved) && (
        <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 1000 }}>
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              color: "var(--text-secondary)",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontSize: "12px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {isSaving ? "Saving draft..." : `Draft saved ${lastSaved}`}
          </div>
        </div>
      )}

      <div className={styles.container}>
        {isCreateMode && (
          <div className={styles.editorHeader}>
            <BackButton fallbackHref="/" className={styles.backLink} />
            <div className={styles.headerText}>
              <p className={styles.kicker}>Recipe</p>
              <h1 className={styles.title}>New Recipe</h1>
            </div>
          </div>
        )}

        {isEditMode && (
          <div className={styles.editorHeader}>
            <BackButton fallbackHref={`/recipes/${recipeId}`} className={styles.backLink} label="Recipe" />
            <div className={styles.headerText}>
              <p className={styles.kicker}>Editing</p>
              <h1 className={styles.title}>{formData.title || "Untitled recipe"}</h1>
            </div>
          </div>
        )}

        <FloatingActionPanel
          ariaLabel={isCreateMode ? "Create recipe actions" : "Edit recipe actions"}
          actions={
            isCreateMode
              ? [
                  {
                    id: "save-draft",
                    icon: "draft",
                    label: isSaving ? "Saving draft" : "Save draft",
                    onClick: handleManualSaveDraft,
                    disabled: isSaving || submitting || !hasDraftContent(),
                  },
                  {
                    id: "create-recipe",
                    icon: "upload",
                    label: submitting ? "Creating recipe" : "Create recipe",
                    onClick: () => void handleSubmit(),
                    disabled: submitting,
                    tone: "primary",
                  },
                ]
              : [
                  {
                    id: "revert",
                    icon: "history",
                    label: "Revert to loaded version",
                    onClick: () => void handleRevert(),
                    disabled: !hasRevertableRecipeChanges || actionBusy,
                  },
                  {
                    id: "delete",
                    icon: "delete",
                    label: deleting ? "Deleting recipe" : "Delete recipe",
                    onClick: () => void handleDelete(),
                    disabled: actionBusy,
                    tone: "danger",
                  },
                ]
          }
        />
        {isCreateMode ? (
          <section className={styles.createCoverSection}>
            <div className={styles.createCoverHeader}>
              <h2 className={activeCreateValidation.image ? styles.createCoverTitleInvalid : ""}>Cover image</h2>
              <span className={`${styles.createCoverRequired} ${activeCreateValidation.image ? styles.createCoverRequiredInvalid : ""}`}>
                Required
              </span>
            </div>

            <button
              type="button"
              className={`${styles.createCoverBox} ${recipeImage ? styles.createCoverBoxFilled : ""} ${activeCreateValidation.image ? styles.createCoverBoxInvalid : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              aria-label={recipeImage ? "Replace cover image" : "Upload cover image"}
            >
              {recipeImage ? (
                <>
                  <img src={recipeImage} alt="Recipe cover" className={styles.createCoverPreviewImage} />
                  <div className={styles.createCoverPreviewMeta}>
                    <span>{imageUploading ? "Saving cover image..." : "Tap to replace cover image"}</span>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      upload
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.createCoverEmptyState}>
                  <span className={`material-symbols-outlined ${styles.createCoverIcon}`} aria-hidden="true">
                    upload
                  </span>
                  <span className={styles.createCoverBoxTitle}>Upload cover image</span>
                  <span className={styles.createCoverBoxNote}>Use a photo of the finished dish before creating the recipe.</span>
                </div>
              )}
            </button>

            <p className={`${styles.coverHint} ${activeCreateValidation.image ? styles.coverHintInvalid : ""}`}>
              {activeCreateValidation.image
                ? "A cover image is required before you create this recipe."
                : "Cover image uses the same boxed upload style as the step cards."}
            </p>
          </section>
        ) : recipeImage ? (
          <div className={styles.coverImageSection}>
            <button
              type="button"
              className={`${styles.imageDisplay} ${isEditMode ? styles.imageDisplayEdit : styles.imageDisplayCreate} ${styles.imageDisplayButton}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              aria-label={isEditMode ? (imageUploading ? "Saving cover image" : "Replace cover image") : "Change cover image"}
              title={isEditMode ? (imageUploading ? "Saving cover image" : "Replace cover image") : "Change cover image"}
            >
              <img src={recipeImage} alt="Recipe cover" className={styles.recipeImage} />
              {isEditMode && (
                <>
                  <span className={styles.replaceImageIconButton} aria-hidden="true">
                    <span className="material-symbols-outlined">photo_camera</span>
                  </span>
                  {imageUploading && <span className={styles.imageSavingBadge}>Saving...</span>}
                </>
              )}
            </button>

            <p className={styles.coverHint}>{imageUploading ? "Saving cover image..." : "Tap image to change cover"}</p>
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <p className={styles.uploadPromptText}>{isCreateMode ? "Cover image *" : "Cover image"}</p>
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (isCreateMode) {
              void handleSubmit();
            }
          }}
          className={styles.form}
        >
          <RecipeBasicsForm
            title={formData.title}
            description={formData.description}
            servings={formData.servings}
            isPublic={formData.isPublic}
            publishDisabled={publishBusy}
            invalidTitle={activeCreateValidation.title}
            invalidDescription={activeCreateValidation.description}
            onTitleChange={(title) => setFormData((prev) => ({ ...prev, title }))}
            onDescriptionChange={(description) => setFormData((prev) => ({ ...prev, description }))}
            onServingsChange={(servings) => setFormData((prev) => ({ ...prev, servings }))}
            onPublishChange={handlePublishChange}
          />

          {isCreateMode && (
            <RecipeOriginSection
              recipeOrigin={formData.recipeOrigin}
              sharedSource={formData.sharedSource}
              sharedSourceLink={formData.sharedSourceLink}
              onRecipeOriginChange={(recipeOrigin: RecipeOrigin) => setFormData((prev) => ({ ...prev, recipeOrigin }))}
              onSharedSourceChange={(sharedSource) => setFormData((prev) => ({ ...prev, sharedSource }))}
              onSharedSourceLinkChange={(sharedSourceLink) => setFormData((prev) => ({ ...prev, sharedSourceLink }))}
            />
          )}

          <IngredientsSection
            mainIngredients={formData.mainIngredients}
            seasonings={formData.seasonings}
            invalidMainIngredients={activeCreateValidation.mainIngredients}
            onMainIngredientsChange={(mainIngredients) => setFormData((prev) => ({ ...prev, mainIngredients }))}
            onSeasoningsChange={(seasonings) => setFormData((prev) => ({ ...prev, seasonings }))}
            onAddMainIngredient={addMainIngredient}
            onRemoveMainIngredient={removeMainIngredient}
            onAddSeasonings={addSeasonings}
            onRemoveSeasonings={removeSeasonings}
          />

          <StepsSection
            steps={formData.steps}
            stepImages={stepImages}
            invalidSteps={activeCreateValidation.steps}
            onStepsChange={(steps) => setFormData((prev) => ({ ...prev, steps }))}
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

          {isEditMode && (
            <RecipeOriginSection
              recipeOrigin={formData.recipeOrigin}
              sharedSource={formData.sharedSource}
              sharedSourceLink={formData.sharedSourceLink}
              onRecipeOriginChange={(recipeOrigin: RecipeOrigin) => setFormData((prev) => ({ ...prev, recipeOrigin }))}
              onSharedSourceChange={(sharedSource) => setFormData((prev) => ({ ...prev, sharedSource }))}
              onSharedSourceLinkChange={(sharedSourceLink) => setFormData((prev) => ({ ...prev, sharedSourceLink }))}
            />
          )}

          <TipsSection tips={formData.tips} onTipsChange={(tips) => setFormData((prev) => ({ ...prev, tips }))} />
        </form>

        {isEditMode && recipeId && (
          <div className={styles.editFooterBar}>
            <div className={styles.editFooterButtons}>
              {showEditStatusButton && (
                <button type="button" className={`${styles.editFooterButton} ${styles.editFooterButtonMuted}`} disabled>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {deleting ? "delete" : editStatusLabel === "Saving" ? "sync" : editStatusLabel === "Save failed" ? "error" : "edit_note"}
                  </span>
                  <span>{editStatusLabel}</span>
                </button>
              )}

              <button
                type="button"
                className={`${styles.editFooterButton} ${editReadyToLeave ? styles.editFooterButtonReady : styles.editFooterButtonDisabled}`}
                onClick={() => router.push(`/recipes/${recipeId}`)}
                disabled={!editReadyToLeave}
              >
                <span className={`material-symbols-outlined ${styles.editFooterIcon}`} aria-hidden="true">
                  {editReadyToLeave ? "exit_to_app" : "edit_note"}
                </span>
                <span>{editReadyToLeave ? "Saved" : "Editing"}</span>
              </button>
            </div>
          </div>
        )}

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