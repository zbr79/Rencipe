"use client";

import { useEffect, useState, type FocusEvent, type InputHTMLAttributes } from "react";

type NumberOnlyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max"> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
};

function clampValue(value: number, min?: number, max?: number) {
  if (typeof min === "number" && value < min) return min;
  if (typeof max === "number" && value > max) return max;
  return value;
}

export default function NumberOnlyInput({ value, onValueChange, min, max, onBlur, ...props }: NumberOnlyInputProps) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    const nextDraft = String(value);
    setDraftValue((current) => (current === nextDraft ? current : nextDraft));
  }, [value]);

  function commitValue(rawValue: string) {
    const digitsOnly = rawValue.replace(/\D+/g, "");
    const nextValue = digitsOnly ? clampValue(parseInt(digitsOnly, 10), min, max) : clampValue(value, min, max);
    setDraftValue(String(nextValue));
    if (nextValue !== value) {
      onValueChange(nextValue);
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    commitValue(event.target.value);
    onBlur?.(event);
  }

  return (
    <input
      {...props}
      data-number-only="true"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draftValue}
      onChange={(event) => {
        const digitsOnly = event.target.value.replace(/\D+/g, "");

        if (!digitsOnly) {
          setDraftValue("");
          return;
        }

        const nextValue = clampValue(parseInt(digitsOnly, 10), min, max);
        setDraftValue(String(nextValue));
        if (nextValue !== value) {
          onValueChange(nextValue);
        }
      }}
      onBlur={handleBlur}
    />
  );
}