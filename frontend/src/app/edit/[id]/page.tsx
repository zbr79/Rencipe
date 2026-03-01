"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../styles.module.css";
import RecipeBasicsForm from "../../create/components/RecipeBasicsForm";
import IngredientsSection from "../../create/components/IngredientsSection";
import StepsSection from "../../create/components/StepsSection";
import TagsSection from "../../create/components/TagsSection";

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
  authorId: string;
  image?: string;
  ingredients: Ingredient[];
  steps: Step[];
  servings: number;
  tags: string[];
}

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);
  const [stepImages, setStepImages] = useState<{ [key: number]: string }>({});
  const [stepImageFiles, setStepImageFiles] = useState<{ [key: number]: File }>({});

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    authorId: string;
    ingredients: Ingredient[];
    steps: Step[];
    servings: number;
    tags: string[];
  }>({
    title: "",
    description: "",
    authorId: "507f1f77bcf86cd799439011",
    ingredients: [{ name: "", quantity: "" }],
    steps: [{ stepNumber: 1, instruction: "" }],
    servings: 1,
    tags: [],
  });

  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/recipes/${recipeId}`);

        if (!response.ok) {
          throw new Error("加载食谱失败");
        }

        const data = await response.json();
        const recipe: RecipeData = data.recipe;

        setFormData({
          title: recipe.title,
          description: recipe.description,
          authorId: recipe.authorId,
          ingredients: recipe.ingredients || [{ name: "", quantity: "" }],
          steps: recipe.steps || [{ stepNumber: 1, instruction: "" }],
          servings: recipe.servings || 1,
          tags: recipe.tags || [],
        });

        if (recipe.image) {
          setRecipeImage(recipe.image);
        }

        // Load step images
        const images: { [key: number]: string } = {};
        if (recipe.steps) {
          recipe.steps.forEach((step) => {
            if (step.image) {
              images[step.stepNumber] = step.image;
            }
          });
        }
        setStepImages(images);

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

  const handleRecipeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRecipeImage(event.target?.result as string);
        setRecipeImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepImageChange = (e: React.ChangeEvent<HTMLInputElement>, stepNumber: number) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the File object for upload
      setStepImageFiles((prev) => ({ ...prev, [stepNumber]: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setStepImages({
          ...stepImages,
          [stepNumber]: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: "", quantity: "" }],
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
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

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("请输入食谱名称");
      return;
    }
    if (!formData.description.trim()) {
      alert("请输入食谱描述");
      return;
    }

    setSubmitting(true);
    try {
      // Update recipe basics
      const updateResponse = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          ingredients: formData.ingredients,
          steps: formData.steps,
          servings: formData.servings,
          tags: formData.tags,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("更新食谱失败");
      }

      const updatedRecipe = await updateResponse.json();

      // Upload recipe image if changed and exists
      if (recipeImageFile && recipeImage) {
        const imageFormData = new FormData();
        imageFormData.append("image", recipeImageFile);

        const imageResponse = await fetch(`/api/recipes/${recipeId}/upload-image`, {
          method: "POST",
          body: imageFormData,
        });

        if (!imageResponse.ok) {
          console.warn("图片上传失败");
        }
      }

      // Upload step images - only upload files that were newly selected
      for (const [stepNumber, file] of Object.entries(stepImageFiles)) {
        const stepFormData = new FormData();
        stepFormData.append("image", file);

        await fetch(`/api/recipes/${recipeId}/steps/${stepNumber}/upload-image`, {
          method: "POST",
          body: stepFormData,
        });
      }

      alert("食谱更新成功!");
      router.push(`/recipes/${recipeId}`);
    } catch (err: any) {
      alert("提交失败: " + (err.message || "未知错误"));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>错误: {error}</p>
          <Link href="/" className={styles.backLink}>
            ← 返回
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={`/recipes/${recipeId}`} className={styles.backLink}>
          ← 返回
        </Link>
        <h1 className={styles.title}>编辑食谱</h1>
      </div>

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

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className={styles.form}>
        <RecipeBasicsForm
          title={formData.title}
          description={formData.description}
          servings={formData.servings}
          onTitleChange={(title) => setFormData({ ...formData, title })}
          onDescriptionChange={(description) => setFormData({ ...formData, description })}
          onServingsChange={(servings) => setFormData({ ...formData, servings })}
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
          <button
            type="submit"
            disabled={submitting}
            className={styles.submitBtn}
          >
            {submitting ? "提交中..." : "保存修改"}
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
