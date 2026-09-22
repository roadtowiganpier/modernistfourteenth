import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireAdminSessionOrRedirect } from "@/lib/auth-guard";
import { LogoutButton } from "./logout-button";

export default async function ProtectedAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminSessionOrRedirect(locale);

  const t = await getTranslations("Admin.nav");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href={`/${locale}/admin/buildings`} className="font-semibold">
          {t("buildings")}
        </Link>
        <LogoutButton locale={locale} label={t("logout")} />
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
