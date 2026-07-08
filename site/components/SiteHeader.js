"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Perfil" },
  { href: "/conteudo", label: "Conteúdo" },
  { href: "/segmentos", label: "Segmentos" },
  { href: "/curriculo", label: "Currículo" },
  { href: "/vaga", label: "Vaga" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 outline-offset-2 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          Tuma Emprego
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
                    : "rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
                }
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
