import { describe, expect, it } from "vitest";
import { parseBuildingFormData } from "./schema";

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

const validFields = {
  name: "Maison Perret",
  address: "2 square de Montsouris",
  historyFr: "Construite en 1923.",
  historyEn: "Built in 1923.",
  styleTags: "Modernist, Concrete",
  lat: "48.8271",
  lng: "2.3372",
};

describe("buildingFormSchema", () => {
  it("accepts a fully valid submission", () => {
    const result = parseBuildingFormData(formData(validFields));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Maison Perret",
        address: "2 square de Montsouris",
        historyFr: "Construite en 1923.",
        historyEn: "Built in 1923.",
        styleTags: ["Modernist", "Concrete"],
        lat: 48.8271,
        lng: 2.3372,
      });
    }
  });

  it("accepts blank lat/lng (both unset)", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, lat: "", lng: "" })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBeNull();
      expect(result.data.lng).toBeNull();
    }
  });

  it("rejects lat set without lng", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, lng: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range lat", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, lat: "999" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range lng", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, lng: "999" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric lat", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, lat: "not-a-number" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a blank name", () => {
    const result = parseBuildingFormData(formData({ ...validFields, name: "  " }));
    expect(result.success).toBe(false);
  });

  it("rejects a blank historyFr", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, historyFr: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a blank historyEn", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, historyEn: "" })
    );
    expect(result.success).toBe(false);
  });

  it("normalizes styleTags", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, styleTags: "Art Deco, art deco, " })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.styleTags).toEqual(["Art Deco"]);
    }
  });

  it("trims name and address", () => {
    const result = parseBuildingFormData(
      formData({ ...validFields, name: "  Maison Perret  ", address: "  2 square de Montsouris  " })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Maison Perret");
      expect(result.data.address).toBe("2 square de Montsouris");
    }
  });
});
