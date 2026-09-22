import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

vi.mock("@/lib/buildings/service", () => ({
  createBuilding: vi.fn(),
  updateBuilding: vi.fn(),
  deleteBuilding: vi.fn(),
  getBuildingById: vi.fn(),
  getCascadeCounts: vi.fn(),
  listBuildings: vi.fn(),
}));

const validFormData = () => {
  const fd = new FormData();
  fd.set("name", "Maison Perret");
  fd.set("address", "2 square de Montsouris");
  fd.set("historyFr", "Construite en 1923.");
  fd.set("historyEn", "Built in 1923.");
  fd.set("styleTags", "Modernist");
  fd.set("lat", "");
  fd.set("lng", "");
  return fd;
};

const emptyState = {
  fieldErrors: {},
  values: {
    name: "",
    address: "",
    historyFr: "",
    historyEn: "",
    styleTags: "",
    lat: "",
    lng: "",
  },
};

describe("buildings server actions — unauthenticated rejection", () => {
  it("createBuildingAction rejects without a session and never touches the service", async () => {
    const { createBuildingAction } = await import("./actions");
    const { createBuilding } = await import("@/lib/buildings/service");

    await expect(
      createBuildingAction("fr", emptyState, validFormData())
    ).rejects.toThrow("Unauthorized");

    expect(createBuilding).not.toHaveBeenCalled();
  });

  it("updateBuildingAction rejects without a session and never touches the service", async () => {
    const { updateBuildingAction } = await import("./actions");
    const { updateBuilding } = await import("@/lib/buildings/service");

    await expect(
      updateBuildingAction("fr", "some-id", emptyState, validFormData())
    ).rejects.toThrow("Unauthorized");

    expect(updateBuilding).not.toHaveBeenCalled();
  });

  it("deleteBuildingAction rejects without a session and never touches the service", async () => {
    const { deleteBuildingAction } = await import("./actions");
    const { deleteBuilding } = await import("@/lib/buildings/service");

    const fd = new FormData();
    fd.set("confirmName", "Maison Perret");

    await expect(
      deleteBuildingAction("fr", "some-id", "Maison Perret", {}, fd)
    ).rejects.toThrow("Unauthorized");

    expect(deleteBuilding).not.toHaveBeenCalled();
  });
});
