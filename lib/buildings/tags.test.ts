import { describe, expect, it } from "vitest";
import { normalizeStyleTags, parseStyleTagsInput } from "./tags";

describe("normalizeStyleTags", () => {
  it("trims whitespace", () => {
    expect(normalizeStyleTags(["  Art Deco  ", "Brutalist "])).toEqual([
      "Art Deco",
      "Brutalist",
    ]);
  });

  it("drops empty entries", () => {
    expect(normalizeStyleTags(["Art Deco", "", "   ", "Brutalist"])).toEqual([
      "Art Deco",
      "Brutalist",
    ]);
  });

  it("de-duplicates case-insensitively, keeping the first casing seen", () => {
    expect(normalizeStyleTags(["Art Deco", "art deco", "ART DECO"])).toEqual([
      "Art Deco",
    ]);
  });
});

describe("parseStyleTagsInput", () => {
  it("splits a comma-separated string and normalizes it", () => {
    expect(parseStyleTagsInput("Art Deco, brutalist,, Art deco ")).toEqual([
      "Art Deco",
      "brutalist",
    ]);
  });

  it("returns an empty array for a blank string", () => {
    expect(parseStyleTagsInput("")).toEqual([]);
  });
});
