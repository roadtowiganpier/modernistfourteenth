import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Single seeded admin account (see prisma/seed.ts) — no public user
// accounts exist. Architecture allows adding further AdminUser rows
// later (see SPEC.md §8) without changing this provider.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin) {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          password,
          admin.passwordHash
        );
        if (!passwordValid) {
          return null;
        }

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
});
