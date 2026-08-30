"use client";

import { useActionState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { NOTA_MAXIMA, NOTA_MINIMA } from "@/lib/constantes";
import { formatarNota, mediaAritmetica } from "@/lib/utils";
import { salvarAvaliacao, type EstadoLancamento } from "./actions";
import { useState } from "react";

const ESTADO_INICIAL: EstadoLancamento = {};

export type ItemCompetencia = {
  id: string;
  grupo: string;
  nome: string;
  /** Nota já lançada por este preceptor nesta área, se houver. */
  valor: number | null;
};

type Props = {
  alunoId: string;
  areaId: string;
  areaNome: string;
  competencias: ItemCompetencia[];
  jaAvaliada: boolean;
};

export function FormularioAvaliacao({
  alunoId,
  areaId,
  areaNome,
  competencias,
  jaAvaliada,
}: Props) {
  const [estado, acao] = useActionState(salvarAvaliacao, ESTADO_INICIAL);

  const [notas, setNotas] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      competencias.map((c) => [c.id, c.valor === null ? "" : String(c.valor)]),
    ),
  );

  const preenchidas = Object.values(notas)
    .map((v) => Number(v.replace(",", ".")))
    .filter((n) => Number.isFinite(n) && String(n) !== "");
  const completas = Object.values(notas).every((v) => v.trim() !== "");
  const previa = completas ? mediaAritmetica(preenchidas) : null;

  const grupos = competencias.reduce<Map<string, ItemCompetencia[]>>((mapa, item) => {
    const atual = mapa.get(item.grupo) ?? [];
    atual.push(item);
    mapa.set(item.grupo, atual);
    return mapa;
  }, new Map());

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

      {jaAvaliada ? (
        <p className="alerta-info">
          Você já avaliou este aluno em {areaNome}. Salvar de novo substitui as suas notas —
          as de outros preceptores não mudam.
        </p>
      ) : null}

      {[...grupos.entries()].map(([grupo, itens]) => (
        <fieldset key={grupo} className="rounded-lg border border-slate-200 p-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {grupo}
          </legend>

          <div className="space-y-3">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <label
                  className="text-sm text-slate-700 sm:flex-1 sm:pr-4"
                  htmlFor={`competencia-${item.id}`}
                >
                  {item.nome}
                </label>

                <input
                  id={`competencia-${item.id}`}
                  name={`competencia-${item.id}`}
                  type="number"
                  className="campo w-full sm:w-28"
                  min={NOTA_MINIMA}
                  max={NOTA_MAXIMA}
                  step="0.01"
                  inputMode="decimal"
                  value={notas[item.id] ?? ""}
                  onChange={(evento) =>
                    setNotas((atual) => ({ ...atual, [item.id]: evento.target.value }))
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
          {jaAvaliada ? "Atualizar avaliação" : "Salvar avaliação"}
        </BotaoEnvio>

        <p className="text-sm text-slate-500">
          {previa === null
            ? `Preencha as ${competencias.length} competências.`
            : `Sua nota nesta área: ${formatarNota(previa)}`}
        </p>
      </div>
    </form>
  );
}
