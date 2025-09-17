"use client";

import React, { useMemo } from "react";
import MasonryGallery, { type MasonryItem } from "./MasonryGallery";
import { useSearch } from "./search/SearchContext";
import { fuzzyIncludes, normalizeKey } from "./search/fuzzy";
import type { ImageMeta } from "../page";

type GalleryConfig = {
  finals: Array<{ slug: string; abbr: string; img: string }>;
  dirs: Record<string, {
    abbr?: string;
    dir: string;
    img: string;
    subs?: Record<string, {
      abbr?: string;
      dir: string;
      img: string;
    }>;
  }>;
};

type Props = {
  items: MasonryItem[];
  metaBySrc?: Record<string, ImageMeta>;
  galleryConfig: GalleryConfig;
};

export default function FilteredMasonry({ items, metaBySrc, galleryConfig }: Props) {
  const { query } = useSearch();

  const filtered = useMemo<MasonryItem[]>(() => {
    const q = query.trim();
    if (q.length === 0) return items;

    // Build a set of all possible abbreviations from the gallery config
    const getAllAbbreviations = (): Set<string> => {
      const abbreviations = new Set<string>();
      
      // Add finals abbreviations from gallery.json
      if (galleryConfig.finals) {
        galleryConfig.finals.forEach((f) => {
          if (f.abbr) abbreviations.add(normalizeKey(f.abbr));
          if (f.slug) abbreviations.add(normalizeKey(f.slug));
        });
      }
      
      // Add character and stage abbreviations from gallery.json
      if (galleryConfig.dirs) {
        Object.entries(galleryConfig.dirs).forEach(([charName, charData]) => {
          // Add character name and abbreviation
          abbreviations.add(normalizeKey(charName));
          if (charData.abbr) abbreviations.add(normalizeKey(charData.abbr));
          
          // Add stage names and abbreviations
          if (charData.subs) {
            Object.entries(charData.subs).forEach(([stageName, stageData]) => {
              abbreviations.add(normalizeKey(stageName));
              if (stageData.abbr) abbreviations.add(normalizeKey(stageData.abbr));
              if (stageData.dir) abbreviations.add(normalizeKey(stageData.dir));
            });
          }
        });
      }
      
      return abbreviations;
    };
    
    const allAbbreviations = getAllAbbreviations();

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
      ? q.slice(1).trim().split(/\s+/).map((t) => {
          // Remove escape backslashes and return the token
          return t.startsWith('\\') ? normalizeKey(t.slice(1)) : normalizeKey(t);
        }).filter(Boolean)
      : [];

    function matchesCommand(src: string, alt?: string): boolean {
      if (!isCommand) return false;
      if (!metaBySrc) return false;
      const meta = metaBySrc[src];
      if (!meta) return false;

      // Parse original tokens to detect escaped terms
      const originalTokens = q.slice(1).trim().split(/\s+/).filter(Boolean);
      const escapedTokens = new Set<string>();
      
      // Track which tokens are escaped (start with \)
      for (const originalToken of originalTokens) {
        if (originalToken.startsWith('\\')) {
          escapedTokens.add(normalizeKey(originalToken.slice(1)));
        }
      }

      // Process each token with unified logic for every word
      for (const token of tokens) {
        let tokenMatches = false;
        
        // If token is escaped, always use fuzzy search
        if (escapedTokens.has(token)) {
          tokenMatches = fuzzySearchToken(token, src, alt, meta);
        }
        // If token matches any abbreviation, use abbreviation search
        else if (allAbbreviations.has(token)) {
          tokenMatches = abbreviationSearchToken(token, meta);
        }
        // Otherwise, use fuzzy search
        else {
          tokenMatches = fuzzySearchToken(token, src, alt, meta);
        }
        
        // If any token doesn't match, the whole command fails
        if (!tokenMatches) {
          return false;
        }
      }
      
      return true;
    }
    
    // Helper function for abbreviation search on a single token
    function abbreviationSearchToken(token: string, meta: any): boolean {
      // character
      if (token === normalizeKey(meta.characterAbbr) || token === normalizeKey(meta.characterName)) return true;
      // stage
      if (meta.stageName) {
        if (token === normalizeKey(meta.stageAbbr || "") || token === normalizeKey(meta.stageName) || token === normalizeKey(meta.stageSlug || "")) return true;
      }
      // finals
      if (meta.finalsTokens && meta.finalsTokens.some((ft: string) => normalizeKey(ft) === token)) return true;
      return false;
    }
    
    // Helper function for fuzzy search on a single token
    function fuzzySearchToken(token: string, src: string, alt: string | undefined, meta: any): boolean {
      const fileName = alt || src;
      const fullPath = src;
      
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

  return <MasonryGallery items={filtered} metaBySrc={metaBySrc} galleryConfig={galleryConfig} />;
}



