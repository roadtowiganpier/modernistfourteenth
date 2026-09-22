import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import * as geocode from "@/lib/geocode";
import {
  createBuilding,
  deleteBuilding,
  getCascadeCounts,
  listBuildings,
  updateBuilding,
} from "./service";

vi.mock("@/lib/geocode", () => ({ geocodeAddress: vi.fn() }));

const geocodeAddress = vi.mocked(geocode.geocodeAddress);

const baseInput = {
  name: "Maison Perret",
  address: "2 square de Montsouris",
  historyFr: "Construite en 1923.",
  historyEn: "Built in 1923.",
  styleTags: ["Modernist"],
  lat: null as number | null,
  lng: null as number | null,
};

afterEach(async () => {
  vi.clearAllMocks();
  await prisma.communityNote.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.building.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("createBuilding", () => {
  it("generates a slug and geocodes when lat/lng are blank", async () => {
    geocodeAddress.mockResolvedValue({ lat: 48.8271, lng: 2.3372 });

    const building = await createBuilding(baseInput);

    expect(building.slug).toBe("maison-perret");
    expect(building.lat).toBe(48.8271);
    expect(building.lng).toBe(2.3372);
    expect(geocodeAddress).toHaveBeenCalledWith(baseInput.address);
  });

  it("saves with null coordinates when geocoding fails, without throwing", async () => {
    geocodeAddress.mockResolvedValue(null);

    const building = await createBuilding(baseInput);

    expect(building.lat).toBeNull();
    expect(building.lng).toBeNull();
  });

  it("never calls geocode when manual coordinates are provided", async () => {
    const building = await createBuilding({
      ...baseInput,
      lat: 1.5,
      lng: 2.5,
    });

    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(building.lat).toBe(1.5);
    expect(building.lng).toBe(2.5);
  });

  it("suffixes the slug on name collision", async () => {
    geocodeAddress.mockResolvedValue(null);

    const first = await createBuilding(baseInput);
    const second = await createBuilding(baseInput);

    expect(first.slug).toBe("maison-perret");
    expect(second.slug).toBe("maison-perret-2");
  });
});

describe("updateBuilding", () => {
  it("re-geocodes when the address changed and coords weren't touched", async () => {
    geocodeAddress.mockResolvedValueOnce({ lat: 1, lng: 1 });
    const building = await createBuilding(baseInput);
    geocodeAddress.mockResolvedValueOnce({ lat: 9.9, lng: 8.8 });

    const updated = await updateBuilding(building.id, {
      ...baseInput,
      address: "New address",
      lat: building.lat,
      lng: building.lng,
    });

    expect(geocodeAddress).toHaveBeenLastCalledWith("New address");
    expect(updated.lat).toBe(9.9);
    expect(updated.lng).toBe(8.8);
  });

  it("does not re-geocode when the address is unchanged", async () => {
    geocodeAddress.mockResolvedValueOnce({ lat: 1, lng: 1 });
    const building = await createBuilding(baseInput);
    geocodeAddress.mockClear();

    const updated = await updateBuilding(building.id, {
      ...baseInput,
      lat: building.lat,
      lng: building.lng,
    });

    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(updated.lat).toBe(1);
    expect(updated.lng).toBe(1);
  });

  it("never overwrites manually-entered coordinates, even if the address also changed", async () => {
    geocodeAddress.mockResolvedValueOnce({ lat: 1, lng: 1 });
    const building = await createBuilding(baseInput);
    geocodeAddress.mockClear();

    const updated = await updateBuilding(building.id, {
      ...baseInput,
      address: "New address",
      lat: 42,
      lng: 43,
    });

    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(updated.lat).toBe(42);
    expect(updated.lng).toBe(43);
  });

  it("does not change the slug when the name changes", async () => {
    geocodeAddress.mockResolvedValueOnce(null);
    const building = await createBuilding(baseInput);

    const updated = await updateBuilding(building.id, {
      ...baseInput,
      name: "Renamed Building",
      lat: building.lat,
      lng: building.lng,
    });

    expect(updated.slug).toBe(building.slug);
    expect(updated.name).toBe("Renamed Building");
  });
});

describe("deleteBuilding / getCascadeCounts", () => {
  it("cascades to Photo and CommunityNote rows", async () => {
    geocodeAddress.mockResolvedValueOnce(null);
    const building = await createBuilding(baseInput);

    await prisma.photo.create({
      data: {
        buildingId: building.id,
        storageKey: "test-key",
        caption: "A caption",
        submitterName: "Test Submitter",
        submitterEmail: "submitter@example.com",
        consentGiven: true,
      },
    });
    await prisma.communityNote.create({
      data: {
        buildingId: building.id,
        text: "A correction",
        submitterName: "Test Submitter",
        submitterEmail: "submitter@example.com",
        consentGiven: true,
      },
    });

    const counts = await getCascadeCounts(building.id);
    expect(counts).toEqual({ photos: 1, communityNotes: 1 });

    await deleteBuilding(building.id);

    expect(await prisma.photo.count({ where: { buildingId: building.id } })).toBe(0);
    expect(
      await prisma.communityNote.count({ where: { buildingId: building.id } })
    ).toBe(0);
    expect(await prisma.building.findUnique({ where: { id: building.id } })).toBeNull();
  });
});

describe("listBuildings", () => {
  it("returns buildings ordered by name", async () => {
    geocodeAddress.mockResolvedValue(null);
    await createBuilding({ ...baseInput, name: "Zebra Building" });
    await createBuilding({ ...baseInput, name: "Alpha Building" });

    const buildings = await listBuildings();
    expect(buildings.map((b) => b.name)).toEqual([
      "Alpha Building",
      "Zebra Building",
    ]);
  });
});
