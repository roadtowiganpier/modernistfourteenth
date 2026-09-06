import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modernist Buildings of Paris XIV",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
