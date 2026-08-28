import Link from "next/link";
import { notFound } from "next/navigation";

import { Auditoria } from "@/components/auditoria";
import { BotaoExcluir } from "@/components/botao-excluir";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calcularNotaFinal,
  formatarCpf,
  formatarData,
  formatarMinutos,
  formatarNota,
} from "@/lib/utils";
import { excluirFrequencia, excluirPontuacao } from "./actions";
import { FormularioFrequencia } from "./formulario-frequencia";
import { FormularioPontuacao } from "./formulario-pontuacao";

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
  searchParams: Promise<{ aba?: string; erro?: string; sucesso?: string }>;
}) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const { aba: abaBruta, erro, sucesso } = await searchParams;

  const aba: Aba = abaBruta === "nota" ? "nota" : "frequencia";

  const aluno = await prisma.matricula.findUnique({
    where: { id },
    include: {
      frequencias: {
        orderBy: [{ dataReferente: "desc" }, { dataEnvio: "desc" }],
        include: { preceptor: { select: { nome: true } } },
      },
      nota: {
        include: {
          pontuacoes: {
            orderBy: { dataEnvio: "desc" },
            include: { preceptor: { select: { nome: true } } },
          },
        },
      },
    },
  });

  if (!aluno) {
    notFound();
  }

  const totalMinutos = aluno.frequencias.reduce((total, f) => total + f.cargaHoraria, 0);

  const pontuacoes = (aluno.nota?.pontuacoes ?? []).map((pontuacao) => ({
    ...pontuacao,
    valor: Number(pontuacao.valor),
  }));

  const { notaFinal, somaPesos, somaPonderada } = calcularNotaFinal(pontuacoes);

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
              <h2 className="titulo-secao mb-1">Lançar pontuação</h2>
              <p className="texto-apoio mb-4">
                Cada competência recebe uma nota e um peso. A nota final é a média ponderada de
                todas as pontuações.
              </p>
              <FormularioPontuacao alunoId={aluno.id} />
            </div>
          </section>

          <section className="cartao overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="titulo-secao">
                Pontuações{" "}
                <span className="text-sm font-normal text-slate-500">({pontuacoes.length})</span>
              </h2>

              {notaFinal === null ? null : (
                <p className="text-sm text-slate-500">
                  {formatarNota(somaPonderada)} / {somaPesos} ={" "}
                  <span className="font-semibold text-slate-900">{formatarNota(notaFinal)}</span>
                </p>
              )}
            </div>

            {pontuacoes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">
                Nenhuma pontuação registrada para este aluno.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Competência</th>
                      <th>Nota</th>
                      <th>Peso</th>
                      <th>Contribuição</th>
                      <th>Preceptor</th>
                      <th>Registro</th>
                      {usuario.administrador ? <th className="text-right">Ações</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {pontuacoes.map((pontuacao) => (
                      <tr key={pontuacao.id}>
                        <td className="font-medium text-slate-900">{pontuacao.nome}</td>
                        <td>{formatarNota(pontuacao.valor)}</td>
                        <td>{pontuacao.peso}</td>
                        <td className="text-slate-500">
                          {formatarNota(pontuacao.valor * pontuacao.peso)}
                        </td>
                        <td>{pontuacao.preceptor.nome}</td>
                        <td>
                          <Auditoria
                            dataEnvio={pontuacao.dataEnvio}
                            ip={pontuacao.ip}
                            browser={pontuacao.browser}
                            os={pontuacao.os}
                            dispositivo={pontuacao.dispositivo}
                          />
                        </td>
                        {usuario.administrador ? (
                          <td>
                            <div className="flex justify-end">
                              <BotaoExcluir
                                acao={excluirPontuacao}
                                nomeCampo="pontuacaoId"
                                valor={pontuacao.id}
                                confirmacao={`Excluir a pontuação de "${pontuacao.nome}"?`}
                              />
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">Nota final</td>
                      <td
                        colSpan={usuario.administrador ? 6 : 5}
                        className="px-4 py-3 text-sm font-semibold text-slate-900"
                      >
                        {notaFinal === null ? "--" : formatarNota(notaFinal)}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          média ponderada de {pontuacoes.length}{" "}
                          {pontuacoes.length === 1 ? "competencia" : "competencias"}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
