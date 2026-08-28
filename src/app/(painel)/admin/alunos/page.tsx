import type { Metadata } from "next";

import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarCpf, somenteDigitos } from "@/lib/utils";
import { AcoesAluno } from "./acoes-aluno";
import { FormularioAluno } from "./formulario-aluno";

export const metadata: Metadata = { title: "Alunos | Controle de Alunos" };

export default async function PaginaAlunos({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string; busca?: string }>;
}) {
  await exigirAdministrador();

  const { erro, sucesso, busca } = await searchParams;
  const termo = (busca ?? "").trim();
  const digitos = somenteDigitos(termo);

  const alunos = await prisma.matricula.findMany({
    where: termo
      ? {
          OR: [
            // mode insensitive: no Postgres o contains é sensível a maiúsculas,
            // ao contrário do SQLite. Sem isso, "ana" não acharia "Ana".
            { nome: { contains: termo, mode: "insensitive" as const } },
            { matricula: { contains: termo, mode: "insensitive" as const } },
            ...(digitos ? [{ cpf: { contains: digitos } }] : []),
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
    take: 200,
    include: {
      _count: { select: { frequencias: true } },
      nota: { select: { _count: { select: { pontuacoes: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Alunos</h1>
        <p className="texto-apoio mt-1">
          Cadastro dos alunos que podem receber frequência e notas.
        </p>
      </div>

      {erro ? (
        <p className="alerta-erro" role="alert">
          {erro}
        </p>
      ) : null}

      {sucesso ? (
        <p className="alerta-sucesso" role="status">
          {sucesso}
        </p>
      ) : null}

      <section className="cartao">
        <div className="cartao-corpo">
          <h2 className="titulo-secao mb-4">Novo aluno</h2>
          <FormularioAluno />
        </div>
      </section>

      <section className="cartao overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="titulo-secao">
            Alunos cadastrados{" "}
            <span className="text-sm font-normal text-slate-500">({alunos.length})</span>
          </h2>

          <form className="flex gap-2">
            <input
              name="busca"
              className="campo w-56"
              placeholder="Filtrar por nome, matrícula ou CPF"
              defaultValue={termo}
            />
            <button type="submit" className="btn-secundario">
              Filtrar
            </button>
          </form>
        </div>

        {alunos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
            {termo ? "Nenhum aluno encontrado para o filtro informado." : "Nenhum aluno cadastrado ainda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>CPF</th>
                  <th>Lançamentos</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno) => {
                  const pontuacoes = aluno.nota?._count.pontuacoes ?? 0;

                  return (
                    <tr key={aluno.id}>
                      <td className="font-medium text-slate-900">{aluno.nome}</td>
                      <td>{aluno.matricula}</td>
                      <td>{formatarCpf(aluno.cpf)}</td>
                      <td className="text-slate-500">
                        {aluno._count.frequencias} freq. · {pontuacoes} pont.
                      </td>
                      <td>
                        <AcoesAluno
                          alunoId={aluno.id}
                          nome={aluno.nome}
                          matricula={aluno.matricula}
                          cpf={aluno.cpf}
                          lancamentos={aluno._count.frequencias + pontuacoes}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
