// Trimmed, empty entries dropped, de-duplicated case-insensitively, first
// occurrence's casing kept — see the Phase 2 plan's tech-lead decisions.
export function normalizeStyleTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

// The admin form collects styleTags as one comma-separated text field.
export function parseStyleTagsInput(input: string): string[] {
  return normalizeStyleTags(input.split(","));
}
