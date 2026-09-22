import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "./actions";

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;

  const session = await auth();
  if (session) {
    redirect(`/${locale}/admin/buildings`);
  }

  const t = await getTranslations("Admin.login");

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <form action={loginAction.bind(null, locale)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email">{t("emailLabel")}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="border rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password">{t("passwordLabel")}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="border rounded px-3 py-2"
          />
        </div>
        {error && (
          <p role="alert" data-testid="login-error" className="text-red-600">
            {t("error")}
          </p>
        )}
        <button type="submit" className="border rounded px-3 py-2 font-medium">
          {t("submit")}
        </button>
      </form>
    </main>
  );
}
