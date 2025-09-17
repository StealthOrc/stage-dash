"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type SearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
  isOpen: boolean;
  open: () => void;
  openWithPrefill: (prefill: string) => void;
  close: () => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  const editableTags = ["input", "textarea", "select"]; 
  if (editableTags.includes(tag)) return true;
  if (target.isContentEditable) return true;
  return false;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const openWithPrefill = (prefill: string) => {
    setIsOpen(true);
    setQuery((prev) => (prev.length === 0 ? prefill : prev + prefill));
  };
  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
        return;
      }

      // Escape closes when open
      if (e.key === "Escape") {
        if (isOpen) {
          e.preventDefault();
          close();
        }
        return;
      }

      // Ignore if user is typing in an editable field (unless search is already open)
      if (!isOpen && isEditableTarget(e.target)) {
        return;
      }

      // Enter should not auto-open
      if (e.key === "Enter") {
        return;
      }

      // Open on any printable character without modifier keys
      const printable = e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey;
      if (!isOpen && printable) {
        // prefill with character
        openWithPrefill(e.key);
        // Prevent page scrolling on space, etc.
        e.preventDefault();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const value = useMemo<SearchContextValue>(() => ({
    query,
    setQuery,
    isOpen,
    open,
    openWithPrefill,
    close,
  }), [query, isOpen]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}


