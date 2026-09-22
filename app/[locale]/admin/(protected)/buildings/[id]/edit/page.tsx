import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAdminSessionOrRedirect } from "@/lib/auth-guard";
import { getBuildingById } from "@/lib/buildings/service";
import { updateBuildingAction } from "../../actions";
import { BuildingForm } from "../../building-form";

export default async function EditBuildingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale, id } = await params;
  const { notice } = await searchParams;
  await requireAdminSessionOrRedirect(locale);

  const building = await getBuildingById(id);
  if (!building) {
    notFound();
  }

  const t = await getTranslations("Admin.buildings.form");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("editTitle")}</h1>
      {notice === "unmapped" && (
        <p role="status" className="text-amber-700">
          {t("unmappedNotice")}
        </p>
      )}
      <BuildingForm
        action={updateBuildingAction.bind(null, locale, id)}
        initialValues={{
          name: building.name,
          address: building.address,
          historyFr: building.historyFr,
          historyEn: building.historyEn,
          styleTags: building.styleTags.join(", "),
          lat: building.lat === null ? "" : String(building.lat),
          lng: building.lng === null ? "" : String(building.lng),
        }}
        labels={{
          nameLabel: t("nameLabel"),
          addressLabel: t("addressLabel"),
          historyFrLabel: t("historyFrLabel"),
          historyEnLabel: t("historyEnLabel"),
          styleTagsLabel: t("styleTagsLabel"),
          latLabel: t("latLabel"),
          lngLabel: t("lngLabel"),
          coordsHint: t("coordsHint"),
          submit: t("editSubmit"),
        }}
      />
    </div>
  );
}
