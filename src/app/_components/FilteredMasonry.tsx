"use client";

import React, { useMemo } from "react";
import MasonryGallery, { type MasonryItem } from "./MasonryGallery";
import { useSearch } from "./search/SearchContext";
import { fuzzyIncludes, normalizeKey } from "./search/fuzzy";
import type { ImageMeta } from "../page";

type Props = {
  items: MasonryItem[];
  metaBySrc?: Record<string, ImageMeta>;
};

export default function FilteredMasonry({ items, metaBySrc }: Props) {
  const { query } = useSearch();

  const filtered = useMemo<MasonryItem[]>(() => {
    const q = query.trim();
    if (q.length === 0) return items;

    const acc: MasonryItem[] = [];
    let lastCharacterDivider: Extract<MasonryItem, { kind: "divider" }> | null = null;
    let lastStageDivider: Extract<MasonryItem, { kind: "divider" }> | null = null;
    let addedCharacterKey: string | null = null;
    let addedStageKey: string | null = null;

    function dividerKey(it: MasonryItem): string {
      if (it.kind !== "divider") return "";
      return `${it.level}:${it.title}`;
    }

    // Command mode: !token token ...
    const isCommand = q.startsWith("!");
    const tokens = isCommand
      ? q.slice(1).trim().split(/\s+/).map((t) => normalizeKey(t)).filter(Boolean)
      : [];

    function matchesCommand(src: string): boolean {
      if (!isCommand) return false;
      if (!metaBySrc) return false;
      const meta = metaBySrc[src];
      if (!meta) return false;
      // All tokens must match something about the image
      return tokens.every((t) => {
        // character
        if (t === normalizeKey(meta.characterAbbr) || t === normalizeKey(meta.characterName)) return true;
        // stage
        if (meta.stageName) {
          if (t === normalizeKey(meta.stageAbbr || "") || t === normalizeKey(meta.stageName) || t === normalizeKey(meta.stageSlug || "")) return true;
        }
        // finals
        if (meta.finalsTokens && meta.finalsTokens.some((ft) => normalizeKey(ft) === t)) return true;
        return false;
      });
    }

    for (const it of items) {
      if (it.kind === "divider") {
        if (it.level === "character") {
          lastCharacterDivider = it;
          lastStageDivider = null;
        } else if (it.level === "stage") {
          lastStageDivider = it;
        }
        continue;
      }

      let match = false;
      if (isCommand) {
        match = matchesCommand(it.src);
      } else {
        const name = it.alt || it.src;
        match = fuzzyIncludes(q, name);
      }
      if (match) {
        if (lastCharacterDivider) {
          const key = dividerKey(lastCharacterDivider);
          if (addedCharacterKey !== key) {
            acc.push(lastCharacterDivider);
            addedCharacterKey = key;
            // Whenever we add a new character divider, reset stage added state
            addedStageKey = null;
          }
        }
        if (lastStageDivider) {
          const key = dividerKey(lastStageDivider);
          if (addedStageKey !== key) {
            acc.push(lastStageDivider);
            addedStageKey = key;
          }
        }
        acc.push(it);
      }
    }
    return acc;
  }, [items, query]);

  return <MasonryGallery items={filtered} />;
}


