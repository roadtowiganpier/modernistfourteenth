import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";
import { generateUniqueSlug } from "./slug";
import type { Building } from "@/app/generated/prisma/client";

export type BuildingInput = {
  name: string;
  address: string;
  historyFr: string;
  historyEn: string;
  styleTags: string[];
  lat: number | null;
  lng: number | null;
};

export async function listBuildings(): Promise<Building[]> {
  return prisma.building.findMany({ orderBy: { name: "asc" } });
}

export async function getBuildingById(id: string): Promise<Building | null> {
  return prisma.building.findUnique({ where: { id } });
}

export async function getCascadeCounts(
  id: string
): Promise<{ photos: number; communityNotes: number }> {
  const [photos, communityNotes] = await Promise.all([
    prisma.photo.count({ where: { buildingId: id } }),
    prisma.communityNote.count({ where: { buildingId: id } }),
  ]);
  return { photos, communityNotes };
}

// Create: coordinates entered manually always win. Only geocode when the
// admin left both blank — see SPEC.md §5.6, point 5 of the Phase 2 plan.
export async function createBuilding(input: BuildingInput): Promise<Building> {
  const slug = await generateUniqueSlug(input.name, async (candidate) => {
    const existing = await prisma.building.findUnique({
      where: { slug: candidate },
    });
    return existing !== null;
  });

  let { lat, lng } = input;
  if (lat === null && lng === null) {
    const geocoded = await geocodeAddress(input.address);
    lat = geocoded?.lat ?? null;
    lng = geocoded?.lng ?? null;
  }

  return prisma.building.create({
    data: {
      slug,
      name: input.name,
      address: input.address,
      historyFr: input.historyFr,
      historyEn: input.historyEn,
      styleTags: input.styleTags,
      lat,
      lng,
    },
  });
}

// Edit: re-geocode only if the address changed AND the admin didn't also
// change lat/lng in this same save. Manual coordinates always win.
export async function updateBuilding(
  id: string,
  input: BuildingInput
): Promise<Building> {
  const existing = await prisma.building.findUniqueOrThrow({ where: { id } });

  const coordsChangedByAdmin =
    input.lat !== existing.lat || input.lng !== existing.lng;
  const addressChanged = input.address !== existing.address;

  let { lat, lng } = input;
  if (!coordsChangedByAdmin && addressChanged) {
    const geocoded = await geocodeAddress(input.address);
    lat = geocoded?.lat ?? null;
    lng = geocoded?.lng ?? null;
  }

  return prisma.building.update({
    where: { id },
    data: {
      name: input.name,
      address: input.address,
      historyFr: input.historyFr,
      historyEn: input.historyEn,
      styleTags: input.styleTags,
      lat,
      lng,
    },
  });
}

// Cascade to Photo/CommunityNote is enforced at the DB level (onDelete:
// Cascade in prisma/schema.prisma) — see DATA-MODEL.md.
export async function deleteBuilding(id: string): Promise<void> {
  await prisma.building.delete({ where: { id } });
}
