import type { Metadata } from "next";

import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarDataHora } from "@/lib/utils";
import { AcoesArea } from "./acoes-area";
import { FormularioArea } from "./formulario-area";

export const metadata: Metadata = { title: "Áreas | Controle de Alunos" };

export default async function PaginaAreas({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  await exigirAdministrador();

  const { erro, sucesso } = await searchParams;

  const [areas, competencias] = await Promise.all([
    prisma.area.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { avaliacoes: true } } },
    }),
    prisma.competencia.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  const grupos = competencias.reduce<Map<string, string[]>>((mapa, competencia) => {
    const atual = mapa.get(competencia.grupo) ?? [];
    atual.push(competencia.nome);
    mapa.set(competencia.grupo, atual);
    return mapa;
  }, new Map());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Áreas</h1>
        <p className="texto-apoio mt-1">
          O preceptor escolhe uma área ao avaliar o aluno. Cada área recebe a mesma lista de
          competências.
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
          <h2 className="titulo-secao mb-4">Nova área</h2>
          <FormularioArea />
        </div>
      </section>

      <section className="cartao overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="titulo-secao">
            Áreas cadastradas{" "}
            <span className="text-sm font-normal text-slate-500">({areas.length})</span>
          </h2>
        </div>

        {areas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
            Nenhuma área cadastrada. Sem pelo menos uma, os preceptores não conseguem lançar
            notas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Avaliações</th>
                  <th>Criada em</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area.id}>
                    <td className="font-medium text-slate-900">{area.nome}</td>
                    <td className="text-slate-500">{area._count.avaliacoes}</td>
                    <td className="text-slate-500">{formatarDataHora(area.criadoEm)}</td>
                    <td>
                      <AcoesArea
                        areaId={area.id}
                        nome={area.nome}
                        avaliacoes={area._count.avaliacoes}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="cartao">
        <div className="cartao-corpo">
          <h2 className="titulo-secao">
            Competências avaliadas{" "}
            <span className="text-sm font-normal text-slate-500">({competencias.length})</span>
          </h2>
          <p className="texto-apoio mt-1">
            Lista fixa, igual em todas as áreas. Todas valem o mesmo na média.
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {[...grupos.entries()].map(([grupo, nomes]) => (
              <div key={grupo}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {grupo}
                </p>
                <ul className="mt-2 space-y-1">
                  {nomes.map((nome) => (
                    <li key={nome} className="text-sm text-slate-700">
                      {nome}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
