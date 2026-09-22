export type BuildingFormValues = {
  name: string;
  address: string;
  historyFr: string;
  historyEn: string;
  styleTags: string;
  lat: string;
  lng: string;
};

export type BuildingFormState = {
  fieldErrors: Record<string, string[]>;
  values: BuildingFormValues;
};

export const emptyBuildingFormState: BuildingFormState = {
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

export function rawValuesFromFormData(formData: FormData): BuildingFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    historyFr: String(formData.get("historyFr") ?? ""),
    historyEn: String(formData.get("historyEn") ?? ""),
    styleTags: String(formData.get("styleTags") ?? ""),
    lat: String(formData.get("lat") ?? ""),
    lng: String(formData.get("lng") ?? ""),
  };
}
