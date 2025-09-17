export function normalize(value: string): string {
  return value.normalize("NFKD").toLowerCase();
}

export function normalizeKey(value: string): string {
  return normalize(value).replace(/[\s_]+/g, "-");
}

// Returns true if query is a fuzzy subsequence of candidate, or a direct substring
export function fuzzyIncludes(queryRaw: string, candidateRaw: string): boolean {
  const query = normalize(queryRaw).trim();
  const candidate = normalize(candidateRaw);
  if (query.length === 0) return true;
  if (candidate.includes(query)) return true;

  // subsequence check
  let qi = 0;
  for (let ci = 0; ci < candidate.length && qi < query.length; ci++) {
    if (candidate[ci] === query[qi]) {
      qi++;
    }
  }
  return qi === query.length;
}
