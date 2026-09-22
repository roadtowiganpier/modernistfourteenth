import { signOut } from "@/auth";

export function LogoutButton({
  locale,
  label,
}: {
  locale: string;
  label: string;
}) {
  async function logout() {
    "use server";
    await signOut({ redirectTo: `/${locale}/admin/login` });
  }

  return (
    <form action={logout}>
      <button type="submit" className="text-sm underline">
        {label}
      </button>
    </form>
  );
}
