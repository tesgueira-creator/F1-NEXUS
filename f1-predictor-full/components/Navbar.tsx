import React from 'react';
import Link from 'next/link';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/drivers', label: 'Pilotos' },
  { href: '/teams', label: 'Equipas' },
  { href: '/tracks', label: 'Pistas' },
  { href: '/simulations', label: 'Simulações' },
  { href: '/data', label: 'Dados' },
  { href: '/analysis', label: 'Análises' },
  { href: '/settings', label: 'Configurações' },
];

export default function Navbar() {
  return (
    <nav className="flex gap-4 p-4 bg-primary font-bold">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
