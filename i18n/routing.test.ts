import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("supports fr and en with fr as the default locale", () => {
    expect(routing.locales).toEqual(["fr", "en"]);
    expect(routing.defaultLocale).toBe("fr");
  });
});
