import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Infante" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}
