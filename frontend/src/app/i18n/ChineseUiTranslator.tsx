"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AUTH_SESSION_KEY, readAuthSession } from "../utils/authSession";
import { chineseUiPatterns, chineseUiText } from "./chineseUiDictionary";

const TRANSLATABLE_ATTRIBUTES = ["aria-label", "placeholder", "title", "alt"];
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE"]);

function getLanguage() {
  return readAuthSession()?.user.language === "zh" ? "zh" : "en";
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  if (SKIPPED_TAGS.has(element.tagName)) return true;
  if (element.closest("[data-i18n-skip]")) return true;
  if (element.closest(".material-symbols-outlined, .material-symbols-rounded")) return true;
  return false;
}

function preserveOuterWhitespace(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function buildReverseDictionary(dictionary: Record<string, string>) {
  return Object.fromEntries(Object.entries(dictionary).map(([english, chinese]) => [chinese, english]));
}

function translateExactOrPattern(value: string, language: "en" | "zh", reverseDictionary: Record<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const exact = language === "zh" ? chineseUiText[trimmed] : reverseDictionary[trimmed];
  if (exact) return preserveOuterWhitespace(value, exact);

  for (const item of chineseUiPatterns) {
    const match = trimmed.match(language === "zh" ? item.pattern : item.reversePattern || item.pattern);
    if (!match) continue;
    const translated = language === "zh" ? item.toChinese(match) : item.toEnglish?.(match);
    if (translated) return preserveOuterWhitespace(value, translated);
  }

  return value;
}

function translateTextNodes(root: ParentNode, language: "en" | "zh", reverseDictionary: Record<string, string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const current = node.textContent || "";
    const next = translateExactOrPattern(current, language, reverseDictionary);
    if (next !== current) node.textContent = next;
  });
}

function translateLeafElementText(root: ParentNode, language: "en" | "zh", reverseDictionary: Record<string, string>) {
  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(root.querySelectorAll("*"));

  elements.forEach((element) => {
    if (shouldSkipElement(element)) return;
    if (element.children.length > 0) return;

    const current = element.textContent || "";
    const next = translateExactOrPattern(current, language, reverseDictionary);
    if (next !== current) element.textContent = next;
  });
}

function translateAttributes(root: ParentNode, language: "en" | "zh", reverseDictionary: Record<string, string>) {
  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(root.querySelectorAll("*"));

  elements.forEach((element) => {
    if (shouldSkipElement(element)) return;

    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (!current) return;
      const next = translateExactOrPattern(current, language, reverseDictionary);
      if (next !== current) element.setAttribute(attribute, next);
    });
  });
}

export default function ChineseUiTranslator() {
  const pathname = usePathname();
  const [language, setLanguage] = useState<"en" | "zh">("en");
  const reverseDictionary = useMemo(() => buildReverseDictionary(chineseUiText), []);
  const translatingRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setLanguage(getLanguage());

    const handleSessionChange = () => setLanguage(getLanguage());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_KEY) handleSessionChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("rencipe-auth-session-change", handleSessionChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("rencipe-auth-session-change", handleSessionChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";

    const runTranslation = () => {
      if (translatingRef.current) return;
      translatingRef.current = true;
      translateLeafElementText(document.body, language, reverseDictionary);
      translateTextNodes(document.body, language, reverseDictionary);
      translateAttributes(document.body, language, reverseDictionary);
      translatingRef.current = false;
    };

    const scheduleTranslation = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        runTranslation();
      });
    };

    scheduleTranslation();

    const observer = new MutationObserver(() => {
      if (!translatingRef.current) scheduleTranslation();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });

    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [language, pathname, reverseDictionary]);

  return null;
}