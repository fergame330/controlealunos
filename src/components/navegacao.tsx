"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNavegacao = { href: string; rotulo: string };

export function Navegacao({ itens }: { itens: ItemNavegacao[] }) {
  const caminho = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {itens.map((item) => {
        const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              ativo
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
