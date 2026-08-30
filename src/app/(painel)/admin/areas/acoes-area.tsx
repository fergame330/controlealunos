"use client";

import { useActionState, useState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { excluirArea, renomearArea, type EstadoArea } from "./actions";

const ESTADO_INICIAL: EstadoArea = {};

type Props = { areaId: string; nome: string; avaliacoes: number };

export function AcoesArea({ areaId, nome, avaliacoes }: Props) {
  const [editando, setEditando] = useState(false);
  const [estado, acao] = useActionState(renomearArea, ESTADO_INICIAL);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="btn-secundario px-3 py-1.5"
          onClick={() => setEditando((valor) => !valor)}
        >
          {editando ? "Cancelar" : "Renomear"}
        </button>

        <form
          action={excluirArea}
          onSubmit={(evento) => {
            if (!window.confirm(`Excluir a área "${nome}"?`)) {
              evento.preventDefault();
            }
          }}
        >
          <input type="hidden" name="areaId" value={areaId} />
          <button type="submit" className="btn-perigo px-3 py-1.5" disabled={avaliacoes > 0}>
            Excluir
          </button>
        </form>
      </div>

      {avaliacoes > 0 ? (
        <p className="text-right text-xs text-slate-400">
          Não pode ser excluída: já tem avaliações.
        </p>
      ) : null}

      {editando ? (
        <form action={acao} className="flex flex-wrap items-end justify-end gap-2">
          <input type="hidden" name="areaId" value={areaId} />

          <div className="w-56">
            <label className="rotulo text-left" htmlFor={`nome-${areaId}`}>
              Novo nome
            </label>
            <input
              id={`nome-${areaId}`}
              name="nome"
              className="campo"
              defaultValue={nome}
              required
              minLength={2}
            />
          </div>

          <BotaoEnvio className="btn-primario px-3 py-2">Salvar</BotaoEnvio>

          {estado.erro ? (
            <p className="w-full text-right text-xs text-red-600" role="alert">
              {estado.erro}
            </p>
          ) : null}

          {estado.sucesso ? (
            <p className="w-full text-right text-xs text-emerald-600" role="status">
              {estado.sucesso}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
