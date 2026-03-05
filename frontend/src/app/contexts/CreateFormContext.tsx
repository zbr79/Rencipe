"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CreateFormContextType {
  isOpen: boolean;
  openCreateForm: () => void;
  closeCreateForm: () => void;
  recipeImage: string | null;
  setRecipeImage: (image: string | null) => void;
  recipeImageFile: File | null;
  setRecipeImageFile: (file: File | null) => void;
  showMealPlanForm: boolean;
  setShowMealPlanForm: (show: boolean) => void;
}

const CreateFormContext = createContext<CreateFormContextType | undefined>(undefined);

export function CreateFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);
  const [showMealPlanForm, setShowMealPlanForm] = useState(false);

  return (
    <CreateFormContext.Provider
      value={{
        isOpen,
        openCreateForm: () => setIsOpen(true),
        closeCreateForm: () => setIsOpen(false),
        recipeImage,
        setRecipeImage,
        recipeImageFile,
        setRecipeImageFile,
        showMealPlanForm,
        setShowMealPlanForm,
      }}
    >
      {children}
    </CreateFormContext.Provider>
  );
}

export function useCreateForm() {
  const context = useContext(CreateFormContext);
  if (!context) {
    throw new Error("useCreateForm must be used within CreateFormProvider");
  }
  return context;
}
