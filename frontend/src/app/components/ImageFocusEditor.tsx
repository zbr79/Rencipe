"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_IMAGE_FOCUS,
  getImageFocusStyle,
  normalizeImageFocus,
  type ImageFocus,
  type ImageFocusSurface,
  type RecipeImageFocus,
} from "../utils/imageFocus";
import styles from "./image-focus-editor.module.css";

interface ImageFocusEditorProps {
  open: boolean;
  image: string | null;
  title: string;
  value: RecipeImageFocus;
  onClose: () => void;
  onSave: (value: RecipeImageFocus) => void;
}

export default function ImageFocusEditor({
  open,
  image,
  title,
  value,
  onClose,
  onSave,
}: ImageFocusEditorProps) {
  const [draft, setDraft] = useState(() => normalizeImageFocus(value));
  const [surface, setSurface] = useState<ImageFocusSurface>("detail");
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; focus: ImageFocus } | null>(null);

  useEffect(() => {
    if (!open) return;
    // Reset the editable draft from the latest recipe value when the editor opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(normalizeImageFocus(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || !image) return null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
        focus: draft[surface],
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage || drag.pointerId !== event.pointerId) return;

    const rect = stage.getBoundingClientRect();
    const nextFocus: ImageFocus = {
      x: drag.focus.x - ((event.clientX - drag.x) / rect.width) * 100,
      y: drag.focus.y - ((event.clientY - drag.y) / rect.height) * 100,
      zoom: drag.focus.zoom,
    };

    setDraft((current) => ({
      ...current,
      [surface]: normalizeImageFocus({ [surface]: nextFocus })[surface],
    }));
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Adjust image focus for ${title}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin image tools</p>
            <h2>Adjust image focus</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close image focus editor">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <div className={styles.surfaceTabs} role="tablist" aria-label="Image display area">
          <button
            type="button"
            role="tab"
            aria-selected={surface === "card"}
            className={surface === "card" ? styles.surfaceTabActive : styles.surfaceTab}
            onClick={() => setSurface("card")}
          >
            Recipe card
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={surface === "hero"}
            className={surface === "hero" ? styles.surfaceTabActive : styles.surfaceTab}
            onClick={() => setSurface("hero")}
          >
            Home slideshow
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={surface === "detail"}
            className={surface === "detail" ? styles.surfaceTabActive : styles.surfaceTab}
            onClick={() => setSurface("detail")}
          >
            Detail page
          </button>
        </div>

        <div
          ref={stageRef}
          className={`${styles.stage} ${surface === "card" ? styles.stageCard : styles.stageWide}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          role="application"
          aria-label="Drag image to adjust focus"
        >
          <img src={image} alt="" style={getImageFocusStyle(draft[surface])} draggable={false} />
          <div className={styles.displayArea} aria-hidden="true" />
        </div>

        <label className={styles.zoomControl}>
          <span>
            <strong>Zoom</strong>
            <span>{draft[surface].zoom.toFixed(2)}×</span>
          </span>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.01"
            value={draft[surface].zoom}
            onChange={(event) => setDraft((current) => ({
              ...current,
              [surface]: { ...current[surface], zoom: Number(event.target.value) },
            }))}
          />
        </label>

        <div className={styles.previewRow}>
          <div>
            <span className={styles.previewLabel}>Card preview</span>
            <div className={`${styles.preview} ${styles.previewCard}`}>
              <img src={image} alt="" style={getImageFocusStyle(draft.card)} />
            </div>
          </div>
          <div>
            <span className={styles.previewLabel}>Home slideshow preview</span>
            <div className={`${styles.preview} ${styles.previewHero}`}>
              <img src={image} alt="" style={getImageFocusStyle(draft.hero)} />
            </div>
          </div>
          <div>
            <span className={styles.previewLabel}>Detail preview</span>
            <div className={`${styles.preview} ${styles.previewDetail}`}>
              <img src={image} alt="" style={getImageFocusStyle(draft.detail)} />
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.resetButton} onClick={() => setDraft((current) => ({ ...current, [surface]: { ...DEFAULT_IMAGE_FOCUS } }))}>
            Reset {surface === "card" ? "card" : surface === "hero" ? "slideshow" : "detail"}
          </button>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button type="button" className={styles.saveButton} onClick={() => onSave(draft)}>Save focus</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
