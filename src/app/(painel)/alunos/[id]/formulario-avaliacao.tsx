"use client";

import { useActionState, useState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { COMPETENCIAS, GRUPOS_COMPETENCIAS } from "@/lib/competencias";
import { NOTA_MAXIMA, NOTA_MINIMA } from "@/lib/constantes";
import { formatarNota, mediaAritmetica } from "@/lib/utils";
import { salvarAvaliacao, type EstadoLancamento } from "./actions";

const ESTADO_INICIAL: EstadoLancamento = {};

type Props = {
  alunoId: string;
  areaId: string;
  areaNome: string;
  /** Nota que este preceptor já lançou nesta área, se houver. */
  notaAtual: number | null;
};

export function FormularioAvaliacao({ alunoId, areaId, areaNome, notaAtual }: Props) {
  const [estado, acao] = useActionState(salvarAvaliacao, ESTADO_INICIAL);
  const [notas, setNotas] = useState<Record<string, string>>({});

  const valores = COMPETENCIAS.map((c) => notas[c.id] ?? "");
  const completas = valores.every((v) => v.trim() !== "");
  const previa = completas
    ? mediaAritmetica(valores.map((v) => Number(v.replace(",", "."))))
    : null;

  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="alunoId" value={alunoId} />
      <input type="hidden" name="areaId" value={areaId} />

      {estado.erro ? (
        <p className="alerta-erro" role="alert">
          {estado.erro}
        </p>
      ) : null}

      {estado.sucesso ? (
        <p className="alerta-sucesso" role="status">
          {estado.sucesso}
        </p>
      ) : null}

      {notaAtual !== null ? (
        <p className="alerta-info">
          Você já avaliou este aluno em {areaNome}, com nota{" "}
          <strong>{formatarNota(notaAtual)}</strong>. Preencher de novo substitui essa nota —
          as de outros preceptores não mudam.
        </p>
      ) : null}

      {GRUPOS_COMPETENCIAS.map(({ grupo, competencias }) => (
        <fieldset key={grupo} className="rounded-lg border border-slate-200 p-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {grupo}
          </legend>

          <div className="space-y-3">
            {competencias.map((competencia) => (
              <div
                key={competencia.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <label
                  className="text-sm text-slate-700 sm:flex-1 sm:pr-4"
                  htmlFor={`competencia-${competencia.id}`}
                >
                  {competencia.nome}
                </label>

                <input
                  id={`competencia-${competencia.id}`}
                  name={`competencia-${competencia.id}`}
                  type="number"
                  className="campo w-full sm:w-28"
                  min={NOTA_MINIMA}
                  max={NOTA_MAXIMA}
                  step="0.01"
                  inputMode="decimal"
                  value={notas[competencia.id] ?? ""}
                  onChange={(evento) =>
                    setNotas((atual) => ({ ...atual, [competencia.id]: evento.target.value }))
                  }
                  required
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <BotaoEnvio carregando="Salvando...">
          {notaAtual === null ? "Salvar avaliação" : "Substituir avaliação"}
        </BotaoEnvio>

        <p className="text-sm text-slate-500">
          {previa === null
            ? `Preencha as ${COMPETENCIAS.length} competências.`
            : `Nota desta avaliação: ${formatarNota(previa)}`}
        </p>
      </div>
    </form>
  );
}
