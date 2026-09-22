import { z } from "zod";
import { parseStyleTagsInput } from "./tags";

// Shared between the admin form (client-side feedback) and the server
// actions (authoritative check) — see the Phase 2 plan, item 3.

const trimmedNonEmpty = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`);

// lat/lng arrive from <input type="number"> as strings, or "" when blank.
const coordinateField = z
  .string()
  .transform((value) => (value === "" ? null : Number(value)));

export const buildingFormSchema = z
  .object({
    name: trimmedNonEmpty("Name"),
    address: trimmedNonEmpty("Address"),
    historyFr: trimmedNonEmpty("historyFr"),
    historyEn: trimmedNonEmpty("historyEn"),
    styleTags: z.string().transform(parseStyleTagsInput),
    lat: coordinateField,
    lng: coordinateField,
  })
  .superRefine((data, ctx) => {
    if (Number.isNaN(data.lat)) {
      ctx.addIssue({ code: "custom", message: "lat must be a number", path: ["lat"] });
    }
    if (Number.isNaN(data.lng)) {
      ctx.addIssue({ code: "custom", message: "lng must be a number", path: ["lng"] });
    }
    if (Number.isNaN(data.lat) || Number.isNaN(data.lng)) return;

    if ((data.lat === null) !== (data.lng === null)) {
      ctx.addIssue({
        code: "custom",
        message: "lat and lng must both be set or both be blank",
        path: ["lat"],
      });
      return;
    }

    if (data.lat !== null && (data.lat < -90 || data.lat > 90)) {
      ctx.addIssue({ code: "custom", message: "lat must be between -90 and 90", path: ["lat"] });
    }
    if (data.lng !== null && (data.lng < -180 || data.lng > 180)) {
      ctx.addIssue({ code: "custom", message: "lng must be between -180 and 180", path: ["lng"] });
    }
  });

export type BuildingFormInput = z.input<typeof buildingFormSchema>;
export type BuildingFormData = z.output<typeof buildingFormSchema>;

export function parseBuildingFormData(formData: FormData) {
  return buildingFormSchema.safeParse({
    name: formData.get("name") ?? "",
    address: formData.get("address") ?? "",
    historyFr: formData.get("historyFr") ?? "",
    historyEn: formData.get("historyEn") ?? "",
    styleTags: formData.get("styleTags") ?? "",
    lat: formData.get("lat") ?? "",
    lng: formData.get("lng") ?? "",
  });
}
