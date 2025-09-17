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

    function matchesCommand(src: string, alt?: string): boolean {
      if (!isCommand) return false;
      if (!metaBySrc) return false;
      const meta = metaBySrc[src];
      if (!meta) return false;

      // Separate abbreviation tokens from fuzzy search tokens
      const abbreviationTokens: string[] = [];
      const fuzzyTokens: string[] = [];
      
      // Try to match each token as an abbreviation first
      for (const token of tokens) {
        let isAbbreviation = false;
        
        // Check character abbreviation
        if (token === normalizeKey(meta.characterAbbr) || token === normalizeKey(meta.characterName)) {
          abbreviationTokens.push(token);
          isAbbreviation = true;
        }
        // Check stage abbreviation
        else if (meta.stageName && (
          token === normalizeKey(meta.stageAbbr || "") || 
          token === normalizeKey(meta.stageName) || 
          token === normalizeKey(meta.stageSlug || "")
        )) {
          abbreviationTokens.push(token);
          isAbbreviation = true;
        }
        // Check finals abbreviations
        else if (meta.finalsTokens && meta.finalsTokens.some((ft) => normalizeKey(ft) === token)) {
          abbreviationTokens.push(token);
          isAbbreviation = true;
        }
        
        // If not an abbreviation, treat as fuzzy search term
        if (!isAbbreviation) {
          fuzzyTokens.push(token);
        }
      }

      // All abbreviation tokens must match (character, stage, or finals)
      const abbreviationMatches = abbreviationTokens.length > 0 && abbreviationTokens.every((token) => {
        // character
        if (token === normalizeKey(meta.characterAbbr) || token === normalizeKey(meta.characterName)) return true;
        // stage
        if (meta.stageName) {
          if (token === normalizeKey(meta.stageAbbr || "") || token === normalizeKey(meta.stageName) || token === normalizeKey(meta.stageSlug || "")) return true;
        }
        // finals
        if (meta.finalsTokens && meta.finalsTokens.some((ft) => normalizeKey(ft) === token)) return true;
        return false;
      });

      // All fuzzy tokens must match the filename, path segments, or directory names
      const fuzzyMatches = fuzzyTokens.length === 0 || fuzzyTokens.every((token) => {
        const fileName = alt || src;
        const fullPath = src; // This includes the full path like "/stages/sonic/city-escape/..."
        
        // Search in filename
        if (fuzzyIncludes(token, fileName)) return true;
        
        // Search in individual path segments (split by /)
        const pathSegments = fullPath.split('/').filter(Boolean);
        for (const segment of pathSegments) {
          if (fuzzyIncludes(token, segment)) return true;
        }
        
        // Search in character name
        if (fuzzyIncludes(token, meta.characterName)) return true;
        
        // Search in stage name and slug
        if (meta.stageName) {
          if (fuzzyIncludes(token, meta.stageName) || fuzzyIncludes(token, meta.stageSlug || "")) return true;
        }
        
        return false;
      });

      return abbreviationMatches && fuzzyMatches;
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
        match = matchesCommand(it.src, it.alt);
      } else {
        const name = it.alt || it.src;
        const fullPath = it.src;
        
        // Split query into individual terms for multi-term fuzzy search
        const searchTerms = q.trim().split(/\s+/).filter(Boolean);
        
        // All terms must match somewhere in the filename, path segments, or metadata
        match = searchTerms.every((term) => {
          // Search in filename
          if (fuzzyIncludes(term, name)) return true;
          
          // Search in path segments and metadata
          if (metaBySrc) {
            const meta = metaBySrc[it.src];
            if (meta) {
              // Search in individual path segments (split by /)
              const pathSegments = fullPath.split('/').filter(Boolean);
              for (const segment of pathSegments) {
                if (fuzzyIncludes(term, segment)) return true;
              }
              
              // Search in character name
              if (fuzzyIncludes(term, meta.characterName)) return true;
              
              // Search in stage name and slug
              if (meta.stageName) {
                if (fuzzyIncludes(term, meta.stageName) || fuzzyIncludes(term, meta.stageSlug || "")) return true;
              }
            }
          }
          
          return false;
        });
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


