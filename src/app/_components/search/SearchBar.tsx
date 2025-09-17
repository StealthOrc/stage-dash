"use client";

import React, { useEffect, useRef } from "react";
import { useSearch } from "./SearchContext";

export default function SearchBar() {
  const { query, setQuery, isOpen, open, close } = useSearch();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // place cursor at end
      const len = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(len, len);
    }
  }, [isOpen]);

  return (
    <div className="w-[min(720px,90vw)]">
      {isOpen ? (
        <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none placeholder:text-white/40"
            placeholder="Search images…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
          />
          {query ? (
            <button
              aria-label="Clear"
              className="rounded px-1 text-white/70 hover:bg-white/10"
              onClick={() => setQuery("")}
            >
              ✕
            </button>
          ) : null}
        </div>
      ) : (
        <button
          className="flex w-full items-center justify-between gap-3 rounded-md bg-white/10 px-3 py-2 text-left text-white/70 hover:bg-white/15"
          onClick={open}
        >
          <span>Search images…</span>
          <kbd className="rounded bg-white/10 px-2 py-1 text-xs text-white/80">Ctrl/⌘ K</kbd>
        </button>
      )}
    </div>
  );
}


