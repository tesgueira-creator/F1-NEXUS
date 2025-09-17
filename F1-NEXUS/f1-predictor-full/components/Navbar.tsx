"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const baseLink = "hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 rounded-sm px-1";
  const isActive = (href: string) => pathname === href;
  const cls = (href: string) => `${baseLink} ${isActive(href) ? "underline underline-offset-4 decoration-white" : ""}`;
  return (
    <nav className="flex gap-4 p-4 bg-primary text-primary-foreground font-bold shadow-pitlane">
      <Link href="/dashboard" className={cls("/dashboard")} aria-current={isActive("/dashboard") ? "page" : undefined}>Dashboard</Link>
      <Link href="/simulations" className={cls("/simulations")} aria-current={isActive("/simulations") ? "page" : undefined}>{"Simula\u00E7\u00F5es"}</Link>
      <Link href="/data" className={cls("/data")} aria-current={isActive("/data") ? "page" : undefined}>Dados</Link>
    </nav>
  );
}
