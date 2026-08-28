import type { Metadata } from "next";

import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = {
  title: "Entrar | Controle de Alunos",
};

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { proximo } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Controle de Alunos
          </h1>
          <p className="texto-apoio mt-1">
            Acesse com seu e-mail e senha institucional.
          </p>
        </div>

        <div className="cartao">
          <div className="cartao-corpo">
            <FormularioLogin proximo={proximo} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Acesso restrito a administradores e preceptores.
        </p>
      </div>
    </main>
  );
}
