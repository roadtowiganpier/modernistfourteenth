import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSessionOrRedirect } from "@/lib/auth-guard";
import { getBuildingById, getCascadeCounts } from "@/lib/buildings/service";
import { deleteBuildingAction } from "../../actions";
import { DeleteConfirmForm } from "./delete-confirm-form";

export default async function DeleteBuildingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireAdminSessionOrRedirect(locale);

  const building = await getBuildingById(id);
  if (!building) {
    notFound();
  }

  const [t, counts] = await Promise.all([
    getTranslations("Admin.buildings.delete"),
    getCascadeCounts(id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {t("title", { name: building.name })}
      </h1>
      <p data-testid="cascade-warning">
        {t("cascadeWarning", {
          photos: counts.photos,
          notes: counts.communityNotes,
        })}
      </p>
      <DeleteConfirmForm
        action={deleteBuildingAction.bind(null, locale, id, building.name)}
        labels={{
          confirmLabel: t("confirmLabel"),
          confirmPlaceholder: t("confirmPlaceholder"),
          confirmButton: t("confirmButton"),
          confirmMismatch: t("confirmMismatch"),
        }}
      />
      <Link href={`/${locale}/admin/buildings`} className="underline">
        {t("cancel")}
      </Link>
    </div>
  );
}
