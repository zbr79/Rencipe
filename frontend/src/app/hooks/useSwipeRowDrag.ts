"use client";

import { MouseEvent, PointerEvent, useRef } from "react";

interface DragState {
  active: boolean;
  moved: boolean;
  pointerId: number;
  startScrollLeft: number;
  startX: number;
}

const EMPTY_DRAG_STATE: DragState = {
  active: false,
  moved: false,
  pointerId: -1,
  startScrollLeft: 0,
  startX: 0,
};

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, input, textarea, select, label"));
}

export function useSwipeRowDrag() {
  const dragStateRef = useRef<DragState>(EMPTY_DRAG_STATE);
  const suppressClickRef = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startScrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 4) {
      dragStateRef.current = { ...dragState, moved: true };
      suppressClickRef.current = true;
      event.currentTarget.scrollLeft = dragState.startScrollLeft - deltaX;
      event.preventDefault();
    }
  };

  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = EMPTY_DRAG_STATE;
    if (dragState.moved) {
      const maxScrollLeft = Math.max(0, event.currentTarget.scrollWidth - event.currentTarget.clientWidth);
      const targetScrollLeft = event.currentTarget.scrollLeft > maxScrollLeft * 0.35 ? maxScrollLeft : 0;
      event.currentTarget.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 220);
    } else {
      suppressClickRef.current = false;
    }
  };

  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  return {
    onClickCapture: handleClickCapture,
    onPointerCancel: finishDrag,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: finishDrag,
  };
}