import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-600">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Página não encontrada
        </h1>
        <p className="texto-apoio mt-2">
          O endereço acessado não existe ou o registro foi removido.
        </p>
        <Link href="/painel" className="btn-primario mt-6">
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
