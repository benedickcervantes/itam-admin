/** Joins multiple filter values for one query param. Must match the API separator. */
const QUERY_LIST_SEPARATOR = "\u001f";

export function csvParam(values: readonly string[]): string | undefined {
  const cleaned = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  return cleaned.length ? cleaned.join(QUERY_LIST_SEPARATOR) : undefined;
}

export function summarizeFilter(
  label: string,
  values: readonly string[],
  labelFor: (value: string) => string = (value) => value,
): string | null {
  if (values.length === 0) return null;
  return `${label}: ${values.map(labelFor).join(", ")}`;
}

export function dropFilterValue(values: readonly string[], value: string): string[] {
  return values.filter((item) => item !== value);
}
