import Link from "next/link";
import type { Metadata } from "next";

import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatarDataHora,
  formatarMinutos,
  formatarNota,
  mediaAritmetica,
} from "@/lib/utils";
import { FormularioBusca } from "./formulario-busca";

export const metadata: Metadata = { title: "Painel | Controle de Alunos" };

export default async function PaginaPainel() {
  const usuario = await exigirUsuario();

  const [frequencias, avaliacoes, totalAlunos] = await Promise.all([
    prisma.frequencia.findMany({
      where: { preceptorId: usuario.id },
      orderBy: { dataEnvio: "desc" },
      take: 5,
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
    }),
    prisma.avaliacao.findMany({
      where: { preceptorId: usuario.id },
      orderBy: { dataEnvio: "desc" },
      take: 5,
      include: {
        aluno: { select: { id: true, nome: true } },
        area: { select: { nome: true } },
        pontuacoes: { select: { valor: true } },
      },
    }),
    prisma.matricula.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Olá, {usuario.nome.split(" ")[0]}
        </h1>
        <p className="texto-apoio mt-1">
          Busque um aluno para lançar frequência ou notas. Há {totalAlunos}{" "}
          {totalAlunos === 1 ? "aluno cadastrado" : "alunos cadastrados"}.
        </p>
      </div>

      <section className="cartao">
        <div className="cartao-corpo">
          <h2 className="titulo-secao mb-4">Localizar aluno</h2>
          <FormularioBusca />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="cartao">
          <div className="cartao-corpo">
            <h2 className="titulo-secao">Suas últimas frequências</h2>

            {frequencias.length === 0 ? (
              <p className="texto-apoio mt-3">Você ainda não lançou frequências.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {frequencias.map((frequencia) => (
                  <li key={frequencia.id} className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/alunos/${frequencia.aluno.id}`}
                        className="text-sm font-medium text-indigo-700 hover:underline"
                      >
                        {frequencia.aluno.nome}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {frequencia.horarioInicio} às {frequencia.horarioFim} ·{" "}
                        {formatarMinutos(frequencia.cargaHoraria)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatarDataHora(frequencia.dataEnvio)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="cartao">
          <div className="cartao-corpo">
            <h2 className="titulo-secao">Suas últimas avaliações</h2>

            {avaliacoes.length === 0 ? (
              <p className="texto-apoio mt-3">Você ainda não avaliou nenhum aluno.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {avaliacoes.map((avaliacao) => {
                  const media = mediaAritmetica(
                    avaliacao.pontuacoes.map((p) => Number(p.valor)),
                  );

                  return (
                    <li key={avaliacao.id} className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/alunos/${avaliacao.aluno.id}?aba=nota`}
                          className="text-sm font-medium text-indigo-700 hover:underline"
                        >
                          {avaliacao.aluno.nome}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {avaliacao.area.nome} · nota{" "}
                          {media === null ? "--" : formatarNota(media)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatarDataHora(avaliacao.dataEnvio)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
