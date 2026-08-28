import { Navegacao, type ItemNavegacao } from "@/components/navegacao";
import { exigirUsuario } from "@/lib/auth";
import { sair } from "./actions";

export default async function LayoutPainel({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usuario = await exigirUsuario();

  const itens: ItemNavegacao[] = [{ href: "/painel", rotulo: "Painel" }];

  if (usuario.administrador) {
    itens.push(
      { href: "/admin/alunos", rotulo: "Alunos" },
      { href: "/admin/preceptores", rotulo: "Preceptores" },
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Controle de Alunos
          </span>

          <Navegacao itens={itens} />

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{usuario.nome}</p>
              <p className="text-xs text-slate-500">
                {usuario.administrador ? "Administrador" : "Preceptor"}
              </p>
            </div>

            <form action={sair}>
              <button type="submit" className="btn-secundario px-3 py-1.5">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
