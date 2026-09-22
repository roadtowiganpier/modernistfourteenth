"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth-guard";
import { parseBuildingFormData } from "@/lib/buildings/schema";
import { createBuilding, deleteBuilding, updateBuilding } from "@/lib/buildings/service";
import {
  rawValuesFromFormData,
  type BuildingFormState,
} from "@/lib/buildings/action-state";

export async function createBuildingAction(
  locale: string,
  _prevState: BuildingFormState,
  formData: FormData
): Promise<BuildingFormState> {
  await requireAdminSession();

  const parsed = parseBuildingFormData(formData);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawValuesFromFormData(formData),
    };
  }

  const building = await createBuilding(parsed.data);
  revalidatePath(`/${locale}/admin/buildings`);

  const notice = building.lat === null ? "?notice=unmapped" : "";
  redirect(`/${locale}/admin/buildings/${building.id}/edit${notice}`);
}

export async function updateBuildingAction(
  locale: string,
  id: string,
  _prevState: BuildingFormState,
  formData: FormData
): Promise<BuildingFormState> {
  await requireAdminSession();

  const parsed = parseBuildingFormData(formData);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: rawValuesFromFormData(formData),
    };
  }

  const building = await updateBuilding(id, parsed.data);
  revalidatePath(`/${locale}/admin/buildings`);
  revalidatePath(`/${locale}/admin/buildings/${id}/edit`);

  const notice = building.lat === null ? "?notice=unmapped" : "";
  redirect(`/${locale}/admin/buildings/${building.id}/edit${notice}`);
}

export type DeleteBuildingState = { error?: "mismatch" };

export async function deleteBuildingAction(
  locale: string,
  id: string,
  expectedName: string,
  _prevState: DeleteBuildingState,
  formData: FormData
): Promise<DeleteBuildingState> {
  await requireAdminSession();

  const typedName = String(formData.get("confirmName") ?? "");
  if (typedName !== expectedName) {
    return { error: "mismatch" };
  }

  await deleteBuilding(id);
  revalidatePath(`/${locale}/admin/buildings`);
  redirect(`/${locale}/admin/buildings`);
}
