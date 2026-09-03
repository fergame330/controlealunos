import Link from "next/link";
import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarDataHora, formatarMinutos, formatarNota } from "@/lib/utils";
import { CartaoAluno } from "@/components/cartao-aluno";
import { procurarAlunos } from "./busca";

export const metadata: Metadata = { title: "Painel | Controle de Alunos" };

export default async function PaginaPainel({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const usuario = await exigirUsuario();
  const { busca } = await searchParams;
  const termo = (busca ?? "").trim();

  const { alunos, correspondenciaExata } = await procurarAlunos(termo);

  // Matrícula ou CPF completo levam direto ao aluno; nome abre a lista.
  if (correspondenciaExata) {
    redirect(`/alunos/${correspondenciaExata.id}`);
  }

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
          <h2 className="titulo-secao mb-1">Localizar aluno</h2>
          <p className="texto-apoio mb-4">
            Busque pelo nome, pelo número de matrícula ou pelo CPF.
          </p>

          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="sr-only" htmlFor="busca">
                Nome, matrícula ou CPF
              </label>
              <input
                id="busca"
                name="busca"
                className="campo"
                placeholder="Ex.: Ana Beatriz, 2024001234 ou 123.456.789-09"
                defaultValue={termo}
                autoComplete="off"
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primario">
              Buscar
            </button>
          </form>

          {termo ? (
            alunos.length === 0 ? (
              <p className="alerta-erro mt-4" role="alert">
                Nenhum aluno encontrado para &quot;{termo}&quot;.
              </p>
            ) : (
              <div className="mt-5">
                <p className="texto-apoio mb-3">
                  {alunos.length === 1
                    ? "1 aluno encontrado."
                    : `${alunos.length} alunos encontrados. Escolha pela foto.`}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {alunos.map((aluno) => (
                    <CartaoAluno key={aluno.id} aluno={aluno} />
                  ))}
                </div>
              </div>
            )
          ) : null}
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
                {avaliacoes.map((avaliacao) => (
                    <li key={avaliacao.id} className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/alunos/${avaliacao.aluno.id}?aba=nota`}
                          className="text-sm font-medium text-indigo-700 hover:underline"
                        >
                          {avaliacao.aluno.nome}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {avaliacao.area.nome} · nota {formatarNota(Number(avaliacao.nota))}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatarDataHora(avaliacao.dataEnvio)}
                      </span>
                    </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
