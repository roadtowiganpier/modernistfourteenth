import { describe, expect, it } from "vitest";
import { generateUniqueSlug } from "./slug";

const neverTaken = async () => false;

describe("generateUniqueSlug", () => {
  it("lowercases and strips accents", async () => {
    const slug = await generateUniqueSlug(
      "Église Notre-Dame-du-Travail",
      neverTaken
    );
    expect(slug).toBe("eglise-notre-dame-du-travail");
  });

  it("replaces non-alphanumerics with hyphens and trims edges", async () => {
    const slug = await generateUniqueSlug(
      "Maison du Brésil, Cité Universitaire",
      neverTaken
    );
    expect(slug).toBe("maison-du-bresil-cite-universitaire");
  });

  it("falls back to a placeholder for a name with no alphanumerics", async () => {
    const slug = await generateUniqueSlug("---", neverTaken);
    expect(slug).toBe("building");
  });

  it("appends a numeric suffix on collision", async () => {
    const taken = new Set(["villa-seurat", "villa-seurat-2"]);
    const isTaken = async (candidate: string) => taken.has(candidate);

    const slug = await generateUniqueSlug("Villa Seurat", isTaken);
    expect(slug).toBe("villa-seurat-3");
  });

  it("returns the base slug when it isn't taken", async () => {
    const isTaken = async (candidate: string) => candidate !== "maison-perret";
    const slug = await generateUniqueSlug("Maison Perret", isTaken);
    expect(slug).toBe("maison-perret");
  });
});
