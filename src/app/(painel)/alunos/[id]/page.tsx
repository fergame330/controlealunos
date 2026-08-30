import Link from "next/link";
import { notFound } from "next/navigation";

import { Auditoria } from "@/components/auditoria";
import { BotaoExcluir } from "@/components/botao-excluir";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatarCpf,
  formatarData,
  formatarMinutos,
  formatarNota,
  resumirNotas,
} from "@/lib/utils";
import { excluirAvaliacao, excluirFrequencia } from "./actions";
import { FormularioAvaliacao } from "./formulario-avaliacao";
import { FormularioFrequencia } from "./formulario-frequencia";

type Aba = "frequencia" | "nota";

const ABAS: Array<{ id: Aba; rotulo: string }> = [
  { id: "frequencia", rotulo: "Frequência" },
  { id: "nota", rotulo: "Nota" },
];

function dataDeHoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export default async function PaginaAluno({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; area?: string; erro?: string; sucesso?: string }>;
}) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const { aba: abaBruta, area: areaSelecionada, erro, sucesso } = await searchParams;

  const aba: Aba = abaBruta === "nota" ? "nota" : "frequencia";

  const aluno = await prisma.matricula.findUnique({
    where: { id },
    include: {
      frequencias: {
        orderBy: [{ dataReferente: "desc" }, { dataEnvio: "desc" }],
        include: { preceptor: { select: { nome: true } } },
      },
      avaliacoes: {
        orderBy: { dataEnvio: "desc" },
        include: {
          area: { select: { id: true, nome: true } },
          preceptor: { select: { id: true, nome: true } },
        },
      },
    },
  });

  if (!aluno) {
    notFound();
  }

  const totalMinutos = aluno.frequencias.reduce((total, f) => total + f.cargaHoraria, 0);

  // O banco guarda a nota de cada preceptor; a área é a média dessas notas e a
  // nota final é a média de todas as avaliações.
  const avaliacoes = aluno.avaliacoes.map((avaliacao) => ({
    ...avaliacao,
    valor: Number(avaliacao.nota),
  }));

  const { porArea, notaFinal, totalAvaliacoes } = resumirNotas(
    avaliacoes.map((a) => ({ areaId: a.area.id, areaNome: a.area.nome, media: a.valor })),
  );

  const areas = await prisma.area.findMany({ orderBy: { nome: "asc" } });
  const area = areas.find((a) => a.id === areaSelecionada) ?? null;

  const minhaAvaliacao = area
    ? avaliacoes.find((a) => a.area.id === area.id && a.preceptor.id === usuario.id)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/painel" className="text-sm text-slate-500 hover:text-slate-800">
            &larr; Voltar ao painel
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{aluno.nome}</h1>
          <p className="texto-apoio mt-1">
            Matrícula {aluno.matricula} · CPF {formatarCpf(aluno.cpf)}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="cartao px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Carga horária</p>
            <p className="text-lg font-semibold text-slate-900">{formatarMinutos(totalMinutos)}</p>
          </div>

          <div className="cartao px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Nota final</p>
            <p className="text-lg font-semibold text-slate-900">
              {notaFinal === null ? "--" : formatarNota(notaFinal)}
            </p>
          </div>
        </div>
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

      <div className="flex gap-1 border-b border-slate-200">
        {ABAS.map((item) => (
          <Link
            key={item.id}
            href={`/alunos/${aluno.id}?aba=${item.id}`}
            aria-current={aba === item.id ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              aba === item.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            {item.rotulo}
          </Link>
        ))}
      </div>

      {aba === "frequencia" ? (
        <>
          <section className="cartao">
            <div className="cartao-corpo">
              <h2 className="titulo-secao mb-1">Lançar frequência</h2>
              <p className="texto-apoio mb-4">
                Data, horários e carga horária do atendimento. O registro guarda quem lançou e de
                onde.
              </p>
              <FormularioFrequencia alunoId={aluno.id} hoje={dataDeHoje()} />
            </div>
          </section>

          <section className="cartao overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="titulo-secao">
                Frequências lançadas{" "}
                <span className="text-sm font-normal text-slate-500">
                  ({aluno.frequencias.length})
                </span>
              </h2>
            </div>

            {aluno.frequencias.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
                Nenhuma frequência registrada para este aluno.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data referente</th>
                      <th>Horário</th>
                      <th>Carga horária</th>
                      <th>Preceptor</th>
                      <th>Registro</th>
                      {usuario.administrador ? <th className="text-right">Ações</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {aluno.frequencias.map((frequencia) => (
                      <tr key={frequencia.id}>
                        <td className="font-medium text-slate-900">
                          {formatarData(frequencia.dataReferente)}
                        </td>
                        <td>
                          {frequencia.horarioInicio} às {frequencia.horarioFim}
                        </td>
                        <td>{formatarMinutos(frequencia.cargaHoraria)}</td>
                        <td>{frequencia.preceptor.nome}</td>
                        <td>
                          <Auditoria
                            dataEnvio={frequencia.dataEnvio}
                            ip={frequencia.ip}
                            browser={frequencia.browser}
                            os={frequencia.os}
                            dispositivo={frequencia.dispositivo}
                          />
                        </td>
                        {usuario.administrador ? (
                          <td>
                            <div className="flex justify-end">
                              <BotaoExcluir
                                acao={excluirFrequencia}
                                nomeCampo="frequenciaId"
                                valor={frequencia.id}
                                confirmacao={`Excluir a frequência de ${formatarData(
                                  frequencia.dataReferente,
                                )}?`}
                              />
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-slate-700">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {formatarMinutos(totalMinutos)}
                      </td>
                      <td colSpan={usuario.administrador ? 3 : 2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="cartao">
            <div className="cartao-corpo">
              <h2 className="titulo-secao mb-1">Avaliar por área</h2>
              <p className="texto-apoio mb-4">
                Escolha a área e dê nota a todas as competências. Sua nota na área é a média
                delas; se outros preceptores avaliarem a mesma área, a nota da área vira a média
                entre vocês.
              </p>

              {areas.length === 0 ? (
                <p className="alerta-info">
                  Nenhuma área cadastrada ainda.{" "}
                  {usuario.administrador ? (
                    <Link href="/admin/areas" className="font-medium underline">
                      Cadastre a primeira área
                    </Link>
                  ) : (
                    "Peça ao administrador para cadastrar as áreas."
                  )}
                  .
                </p>
              ) : (
                <>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {areas.map((opcao) => {
                      const avaliada = avaliacoes.some(
                        (a) => a.area.id === opcao.id && a.preceptor.id === usuario.id,
                      );

                      return (
                        <Link
                          key={opcao.id}
                          href={`/alunos/${aluno.id}?aba=nota&area=${opcao.id}`}
                          aria-current={area?.id === opcao.id ? "true" : undefined}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                            area?.id === opcao.id
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opcao.nome}
                          {avaliada ? <span className="ml-1.5 text-emerald-600">✓</span> : null}
                        </Link>
                      );
                    })}
                  </div>

                  {area ? (
                    <FormularioAvaliacao
                      alunoId={aluno.id}
                      areaId={area.id}
                      areaNome={area.nome}
                      notaAtual={minhaAvaliacao ? minhaAvaliacao.valor : null}
                    />
                  ) : (
                    <p className="texto-apoio">
                      Selecione uma área acima para lançar ou revisar as notas. O ✓ marca as
                      áreas que você já avaliou.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="cartao overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="titulo-secao">
                Notas por área{" "}
                <span className="text-sm font-normal text-slate-500">
                  ({porArea.length} {porArea.length === 1 ? "área" : "áreas"})
                </span>
              </h2>

              {notaFinal === null ? null : (
                <p className="text-sm text-slate-500">
                  Nota final{" "}
                  <span className="font-semibold text-slate-900">{formatarNota(notaFinal)}</span>{" "}
                  — média de {totalAvaliacoes}{" "}
                  {totalAvaliacoes === 1 ? "avaliação" : "avaliações"}
                </p>
              )}
            </div>

            {porArea.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
                Nenhuma avaliação registrada para este aluno.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {porArea.map((resumo) => (
                  <div key={resumo.areaId} className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-medium text-slate-900">{resumo.areaNome}</h3>
                      <p className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-900">
                          {formatarNota(resumo.media)}
                        </span>{" "}
                        · {resumo.avaliacoes}{" "}
                        {resumo.avaliacoes === 1 ? "preceptor" : "preceptores"}
                      </p>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                      <table className="tabela">
                        <thead>
                          <tr>
                            <th>Preceptor</th>
                            <th>Nota</th>
                            <th>Registro</th>
                            {usuario.administrador ? <th className="text-right">Ações</th> : null}
                          </tr>
                        </thead>
                        <tbody>
                          {avaliacoes
                            .filter((a) => a.area.id === resumo.areaId)
                            .map((avaliacao) => (
                              <tr key={avaliacao.id}>
                                <td className="font-medium text-slate-900">
                                  {avaliacao.preceptor.nome}
                                  {avaliacao.preceptor.id === usuario.id ? (
                                    <span className="ml-2 text-xs font-normal text-slate-400">
                                      (você)
                                    </span>
                                  ) : null}
                                </td>
                                <td className="font-semibold text-slate-900">
                                  {formatarNota(avaliacao.valor)}
                                </td>
                                <td>
                                  <Auditoria
                                    dataEnvio={avaliacao.dataEnvio}
                                    ip={avaliacao.ip}
                                    browser={avaliacao.browser}
                                    os={avaliacao.os}
                                    dispositivo={avaliacao.dispositivo}
                                  />
                                </td>
                                {usuario.administrador ? (
                                  <td>
                                    <div className="flex justify-end">
                                      <BotaoExcluir
                                        acao={excluirAvaliacao}
                                        nomeCampo="avaliacaoId"
                                        valor={avaliacao.id}
                                        confirmacao={`Excluir a avaliação de ${avaliacao.preceptor.nome} em ${avaliacao.area.nome}?`}
                                      />
                                    </div>
                                  </td>
                                ) : null}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
