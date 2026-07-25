/** Trim + split free-text search into tokens (AND across tokens). */
export function searchTokens(search?: string | null): string[] {
  return (search ?? "")
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** Every token must appear in at least one of the provided field values. */
export function matchesSearchTokens(
  search: string | null | undefined,
  fields: Array<string | null | undefined>,
): boolean {
  const tokens = searchTokens(search);
  if (!tokens.length) return true;
  const haystack = fields
    .map((f) => (f ?? "").toLowerCase())
    .filter(Boolean);
  if (!haystack.length) return false;
  return tokens.every((token) => {
    const t = token.toLowerCase();
    return haystack.some((field) => field.includes(t));
  });
}
