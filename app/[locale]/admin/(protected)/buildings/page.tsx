import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireAdminSessionOrRedirect } from "@/lib/auth-guard";
import { listBuildings } from "@/lib/buildings/service";

export default async function AdminBuildingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminSessionOrRedirect(locale);

  const [t, buildings] = await Promise.all([
    getTranslations("Admin.buildings.list"),
    listBuildings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link
          href={`/${locale}/admin/buildings/new`}
          className="border rounded px-4 py-2 font-medium"
        >
          {t("newButton")}
        </Link>
      </div>

      {buildings.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">{t("columnName")}</th>
              <th className="py-2">{t("columnAddress")}</th>
              <th className="py-2">{t("columnGeocoded")}</th>
              <th className="py-2">{t("columnUpdatedAt")}</th>
              <th className="py-2">{t("columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((building) => (
              <tr key={building.id} className="border-b">
                <td className="py-2">{building.name}</td>
                <td className="py-2">{building.address}</td>
                <td className="py-2">
                  {building.lat !== null && building.lng !== null
                    ? t("geocodedYes")
                    : t("geocodedNo")}
                </td>
                <td className="py-2">
                  {new Date(building.updatedAt).toLocaleDateString(locale)}
                </td>
                <td className="py-2 flex gap-3">
                  <Link
                    href={`/${locale}/admin/buildings/${building.id}/edit`}
                    className="underline"
                  >
                    {t("editLink")}
                  </Link>
                  <Link
                    href={`/${locale}/admin/buildings/${building.id}/delete`}
                    className="underline"
                  >
                    {t("deleteLink")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
