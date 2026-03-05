"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DraftData {
  title: string;
  description: string;
  image?: string;
  component?: boolean;
  ingredients: Array<{ name: string; quantity: string }>;
  steps: Array<{ stepNumber: number; instruction: string; image?: string }>;
  servings: number;
  tags: string[];
  updatedAt?: string | Date;
}

interface UseDraftOptions {
  authorId: string;
  enabled?: boolean;
}

export function useDraft({ authorId, enabled = true }: UseDraftOptions) {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const initialDataRef = useRef<DraftData | null>(null);

  // Load draft on mount
  useEffect(() => {
    if (!enabled || !authorId) return;

    const loadDraft = async () => {
      try {
        const res = await fetch(`/api/drafts?authorId=${authorId}`);
        const data = await res.json();
        if (data.draft) {
          setDraft(data.draft);
          initialDataRef.current = data.draft;
        }
        setDraftLoaded(true);
      } catch (err) {
        console.error("Failed to load draft:", err);
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, [authorId, enabled]);

  // Auto-save draft (debounced every 2 seconds)
  const saveDraft = useCallback(
    async (data: DraftData) => {
      if (!enabled || !authorId) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set timeout for debounced save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          const res = await fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authorId,
              ...data,
            }),
          });

          if (res.ok) {
            setLastSaved(new Date().toLocaleTimeString());
            setIsSaving(false);
          }
        } catch (err) {
          console.error("Failed to save draft:", err);
          setIsSaving(false);
        }
      }, 2000); // Debounce 2 seconds
    },
    [authorId, enabled]
  );

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!enabled || !authorId) return;

    try {
      await fetch(`/api/drafts?authorId=${authorId}`, { method: "DELETE" });
      setDraft(null);
      setHasUnsavedChanges(false);
      initialDataRef.current = null;
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  }, [authorId, enabled]);

  // Track unsaved changes
  const updateHasChanges = useCallback((data: DraftData) => {
    const hasChanges = JSON.stringify(data) !== JSON.stringify(initialDataRef.current);
    setHasUnsavedChanges(hasChanges);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    draftLoaded,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveDraft,
    deleteDraft,
    updateHasChanges,
  };
}
