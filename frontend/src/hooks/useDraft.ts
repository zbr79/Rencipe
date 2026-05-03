"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DraftData {
  name?: string;
  title: string;
  description: string;
  image?: string;
  component?: boolean;
  mainIngredients?: Array<{ name: string; quantity: string }>;
  seasonings?: Array<{ name: string; quantity: string }>;
  ingredients?: Array<{ name: string; quantity: string }>;
  steps: Array<{ stepNumber: number; instruction: string; image?: string }>;
  servings: number;
  tags: string[];
  updatedAt?: string | Date;
}

interface UseDraftOptions {
  authorId: string;
  draftId?: string;
  enabled?: boolean;
}

export function useDraft({ authorId, draftId, enabled = true }: UseDraftOptions) {
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
        let url = `/api/drafts?authorId=${authorId}`;
        if (draftId) {
          url += `&id=${draftId}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        
        // If we're looking for a specific draft, use that; otherwise use the first one
        const draftData = draftId ? data.draft : (data.drafts && data.drafts[0]);
        if (draftData) {
          setDraft(draftData);
          initialDataRef.current = draftData;
        }
        setDraftLoaded(true);
      } catch (err) {
        console.error("Failed to load draft:", err);
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, [authorId, draftId, enabled]);

  // Auto-save draft (debounced every 2 seconds)
  const saveDraft = useCallback(
    async (data: DraftData, draftName?: string) => {
      if (!enabled || !authorId) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set timeout for debounced save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          
          // If we have a draftId, update the draft
          if (draftId) {
            const res = await fetch("/api/drafts", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: draftId,
                authorId,
                name: draftName,
                ...data,
              }),
            });

            if (res.ok) {
              setLastSaved(new Date().toLocaleTimeString());
              setIsSaving(false);
            }
          } else {
            // Otherwise, create a new draft
            const res = await fetch("/api/drafts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                authorId,
                name: draftName || "Untitled Draft",
                ...data,
              }),
            });

            if (res.ok) {
              setLastSaved(new Date().toLocaleTimeString());
              setIsSaving(false);
            }
          }
        } catch (err) {
          console.error("Failed to save draft:", err);
          setIsSaving(false);
        }
      }, 2000); // Debounce 2 seconds
    },
    [authorId, draftId, enabled]
  );

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!enabled || !authorId) return;

    try {
      let url = `/api/drafts?authorId=${authorId}`;
      if (draftId) {
        url += `&id=${draftId}`;
      }
      await fetch(url, { method: "DELETE" });
      setDraft(null);
      setHasUnsavedChanges(false);
      initialDataRef.current = null;
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  }, [authorId, draftId, enabled]);

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
  };
}
