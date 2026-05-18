"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DraftData {
  _id?: string;
  draftType?: "recipe" | "meal";
  name?: string;
  title?: string;
  description?: string;
  tips?: string;
  recipeOrigin?: "original" | "shared";
  sharedSource?: string;
  sharedSourceLink?: string;
  image?: string;
  component?: boolean;
  isPublic?: boolean;
  mainIngredients?: Array<{ name: string; quantity: string }>;
  seasonings?: Array<{ name: string; quantity: string }>;
  ingredients?: Array<{ name: string; quantity: string }>;
  steps?: Array<{ stepNumber: number; instruction: string; image?: string }>;
  servings?: number;
  tags?: string[];
  people?: Array<{ name: string; modifier: number }>;
  recipes?: Array<{ id?: string; _id?: string; title: string; description?: string; image?: string }>;
  updatedAt?: string | Date;
}

interface UseDraftOptions {
  authorId: string;
  draftId?: string;
  enabled?: boolean;
}

interface SaveDraftOptions {
  immediate?: boolean;
}

export function useDraft({ authorId, draftId, enabled = true }: UseDraftOptions) {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentDraftIdRef = useRef<string | null>(draftId || null);
  const initialDataRef = useRef<DraftData | null>(null);

  useEffect(() => {
    currentDraftIdRef.current = draftId || null;
    setCurrentDraftId(draftId || null);
  }, [draftId]);

  useEffect(() => {
    if (!enabled || !authorId) return;

    if (!draftId) {
      setDraft(null);
      setDraftLoaded(true);
      return;
    }

    const loadDraft = async () => {
      try {
        let url = `/api/drafts?authorId=${authorId}`;
        if (draftId) {
          url += `&id=${draftId}`;
        }
        const res = await fetch(url);
        const data = await res.json();

        const draftData = data.draft;
        if (draftData) {
          setDraft(draftData);
          setCurrentDraftId(draftData._id);
          currentDraftIdRef.current = draftData._id;
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

  const saveDraft = useCallback(
    async (data: DraftData, draftName?: string, options: SaveDraftOptions = {}) => {
      if (!enabled || !authorId) return null;

      const runSave = async () => {
        try {
          setIsSaving(true);
          const activeDraftId = currentDraftIdRef.current;
          const response = await fetch(activeDraftId ? "/api/drafts" : "/api/drafts", {
            method: activeDraftId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(activeDraftId ? { id: activeDraftId } : {}),
              authorId,
              name: draftName || data.title || "Untitled Draft",
              ...data,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save draft");
          }

          const saved = await response.json();
          const savedDraft = saved.draft || null;
          if (savedDraft?._id) {
            currentDraftIdRef.current = savedDraft._id;
            setCurrentDraftId(savedDraft._id);
            setDraft(savedDraft);
            initialDataRef.current = savedDraft;
          }
          setLastSaved(new Date().toLocaleTimeString());
          setHasUnsavedChanges(false);
          return savedDraft;
        } catch (err) {
          console.error("Failed to save draft:", err);
          setHasUnsavedChanges(true);
          return null;
        } finally {
          setIsSaving(false);
        }
      };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      if (options.immediate) {
        return runSave();
      }

      setHasUnsavedChanges(true);
      saveTimeoutRef.current = setTimeout(() => {
        void runSave();
      }, 1200);

      return null;
    },
    [authorId, enabled]
  );

  const deleteDraft = useCallback(async () => {
    if (!enabled || !authorId) return;
    const idToDelete = currentDraftIdRef.current;
    if (!idToDelete) return;

    try {
      const url = `/api/drafts?authorId=${authorId}&id=${idToDelete}`;
      await fetch(url, { method: "DELETE" });
      setDraft(null);
      setCurrentDraftId(null);
      currentDraftIdRef.current = null;
      setHasUnsavedChanges(false);
      initialDataRef.current = null;
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  }, [authorId, enabled]);

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
    currentDraftId,
    saveDraft,
    deleteDraft,
  };
}
