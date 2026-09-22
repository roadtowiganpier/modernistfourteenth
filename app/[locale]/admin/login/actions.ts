"use server";

import { signIn } from "@/auth";

// Always redirects — to the buildings list on success, or back to this
// same login page (our `pages.signIn`) with ?error=... on failure, which
// the page reads to show the error message. See auth.ts for the
// credentials provider and the `trustHost` note.
export async function loginAction(locale: string, formData: FormData): Promise<void> {
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: `/${locale}/admin/buildings`,
  });
}
