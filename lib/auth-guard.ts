import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Session checks live here, not in middleware — middleware alone isn't a
// sufficient guard (see CLAUDE.md / the Phase 2 plan, scope item 1). Every
// protected page AND every mutation calls one of these itself.

// For Server Components (the protected layout): sends an unauthenticated
// visitor to the current locale's login page.
export async function requireAdminSessionOrRedirect(locale: string) {
  const session = await auth();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }
  return session;
}

// For Server Actions: rejects rather than redirects, since an action is a
// POST endpoint that can be hit directly, not just rendered.
export async function requireAdminSession() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
