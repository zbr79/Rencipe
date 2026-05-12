"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import ConfirmModal, { type ConfirmModalIntent } from "./ConfirmModal";

interface DialogOptions {
  title: string;
  message: ReactNode;
  intent?: ConfirmModalIntent;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface DialogRequest extends DialogOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmDialogContextValue {
  confirm: (options: DialogOptions) => Promise<boolean>;
  notify: (options: Omit<DialogOptions, "showCancel">) => Promise<void>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export default function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const openDialog = useCallback((options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest((current) => {
        current?.resolve(false);
        return {
          title: options.title,
          message: options.message,
          intent: options.intent || "neutral",
          confirmText: options.confirmText || (options.showCancel === false ? "OK" : "Confirm"),
          cancelText: options.cancelText || "Cancel",
          showCancel: options.showCancel !== false,
          resolve,
        };
      });
    });
  }, []);

  const confirm = useCallback((options: DialogOptions) => openDialog({ ...options, showCancel: options.showCancel !== false }), [openDialog]);

  const notify = useCallback(async (options: Omit<DialogOptions, "showCancel">) => {
    await openDialog({ ...options, showCancel: false });
  }, [openDialog]);

  const resolveRequest = useCallback((value: boolean) => {
    setRequest((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const contextValue = useMemo<ConfirmDialogContextValue>(() => ({ confirm, notify }), [confirm, notify]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <ConfirmModal
        open={Boolean(request)}
        title={request?.title || ""}
        message={request?.message || ""}
        intent={request?.intent}
        confirmText={request?.confirmText}
        cancelText={request?.cancelText}
        showCancel={request?.showCancel}
        onConfirm={() => resolveRequest(true)}
        onCancel={() => resolveRequest(false)}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
}