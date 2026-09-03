"use client";

import { useState } from "react";
import styles from "./unit-converter.module.css";

type Unit = { id: string; label: string; base: number };

const VOLUME_UNITS: Unit[] = [
  { id: "cup", label: "cups", base: 240 },
  { id: "tbsp", label: "tbsp", base: 15 },
  { id: "tsp", label: "tsp", base: 5 },
  { id: "ml", label: "ml", base: 1 },
  { id: "lit", label: "L", base: 1000 },
];

const WEIGHT_UNITS: Unit[] = [
  { id: "g", label: "g", base: 1 },
  { id: "kg", label: "kg", base: 1000 },
  { id: "oz", label: "oz", base: 28.3495 },
  { id: "lb", label: "lb", base: 453.592 },
];

function convert(value: number, from: Unit, to: Unit) {
  const raw = (value * from.base) / to.base;
  const rounded = Math.round(raw * 1000) / 1000;
  return String(Number(rounded));
}

function validNumber(value: string) {
  const number = parseFloat(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function UnitRow({ units, defaultFromId, defaultToId }: { units: Unit[]; defaultFromId: string; defaultToId: string }) {
  const [fromValue, setFromValue] = useState("1");
  const [fromId, setFromId] = useState(defaultFromId);
  const [toId, setToId] = useState(defaultToId);
  const [toValue, setToValue] = useState(() => {
    const from = units.find((unit) => unit.id === defaultFromId)!;
    const to = units.find((unit) => unit.id === defaultToId)!;
    return convert(1, from, to);
  });

  const from = units.find((unit) => unit.id === fromId)!;
  const to = units.find((unit) => unit.id === toId)!;

  function handleFromChange(value: string) {
    setFromValue(value);
    const number = validNumber(value);
    if (number !== null) setToValue(convert(number, from, to));
  }

  function handleToChange(value: string) {
    setToValue(value);
    const number = validNumber(value);
    if (number !== null) setFromValue(convert(number, to, from));
  }

  function selectFrom(id: string) {
    setFromId(id);
    const unit = units.find((item) => item.id === id)!;
    const base = validNumber(fromValue) ?? 1;
    setToValue(convert(base, unit, to));
  }

  function selectTo(id: string) {
    setToId(id);
    const unit = units.find((item) => item.id === id)!;
    const base = validNumber(fromValue) ?? 1;
    setToValue(convert(base, from, unit));
  }

  return (
    <div className={styles.group}>
      <div className={styles.line}>
        <span className={styles.sideLabel}>From</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={fromValue}
          onChange={(event) => handleFromChange(event.target.value)}
          className={styles.input}
          aria-label="From amount"
        />
        <div className={styles.pills}>
          {units.map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => selectFrom(unit.id)}
              className={`${styles.pill} ${unit.id === fromId ? styles.pillActive : ""}`}
              aria-pressed={unit.id === fromId}
            >
              {unit.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.line}>
        <span className={styles.sideLabel}>To</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={toValue}
          onChange={(event) => handleToChange(event.target.value)}
          className={`${styles.input} ${styles.inputResult}`}
          aria-label="To amount"
        />
        <div className={styles.pills}>
          {units.map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => selectTo(unit.id)}
              className={`${styles.pill} ${unit.id === toId ? styles.pillActive : ""}`}
              aria-pressed={unit.id === toId}
            >
              {unit.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UnitConverter() {
  return (
    <div className={styles.converter}>
      <p className={styles.groupLabel}>Volume</p>
      <UnitRow units={VOLUME_UNITS} defaultFromId="cup" defaultToId="ml" />

      <p className={styles.groupLabel}>Weight</p>
      <UnitRow units={WEIGHT_UNITS} defaultFromId="oz" defaultToId="g" />
    </div>
  );
}