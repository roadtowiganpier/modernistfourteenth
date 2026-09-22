// Slug is generated once at creation from `name` and is immutable — see
// SPEC.md §5.6. Renaming a building later never changes its slug.

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Calls isSlugTaken with each candidate until one comes back false; on
// collision a numeric suffix is appended (-2, -3, ...).
export async function generateUniqueSlug(
  name: string,
  isSlugTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(name) || "building";

  let candidate = base;
  let suffix = 2;
  while (await isSlugTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
