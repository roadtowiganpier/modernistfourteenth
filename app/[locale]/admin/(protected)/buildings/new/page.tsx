import { getTranslations } from "next-intl/server";
import { requireAdminSessionOrRedirect } from "@/lib/auth-guard";
import { emptyBuildingFormState } from "@/lib/buildings/action-state";
import { createBuildingAction } from "../actions";
import { BuildingForm } from "../building-form";

export default async function NewBuildingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminSessionOrRedirect(locale);

  const t = await getTranslations("Admin.buildings.form");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
      <BuildingForm
        action={createBuildingAction.bind(null, locale)}
        initialValues={emptyBuildingFormState.values}
        labels={{
          nameLabel: t("nameLabel"),
          addressLabel: t("addressLabel"),
          historyFrLabel: t("historyFrLabel"),
          historyEnLabel: t("historyEnLabel"),
          styleTagsLabel: t("styleTagsLabel"),
          latLabel: t("latLabel"),
          lngLabel: t("lngLabel"),
          coordsHint: t("coordsHint"),
          submit: t("createSubmit"),
        }}
      />
    </div>
  );
}
