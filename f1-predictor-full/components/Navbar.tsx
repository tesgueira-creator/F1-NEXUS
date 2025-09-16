import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="flex gap-4 p-4 bg-primary font-bold">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/simulations">Simulações</Link>
      <Link href="/data">Dados</Link>
    </nav>
  );
}
