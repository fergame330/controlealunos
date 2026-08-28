"use client";

import { useActionState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { buscarAluno, type EstadoBusca } from "./actions";

const ESTADO_INICIAL: EstadoBusca = {};

export function FormularioBusca() {
  const [estado, acao] = useActionState(buscarAluno, ESTADO_INICIAL);

  return (
    <form action={acao} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="rotulo" htmlFor="termo">
            Número de matrícula ou CPF
          </label>
          <input
            id="termo"
            name="termo"
            className="campo"
            placeholder="Ex.: 2024001234 ou 123.456.789-09"
            autoComplete="off"
            required
            autoFocus
          />
        </div>

        <div className="flex items-end">
          <BotaoEnvio className="btn-primario w-full sm:w-auto" carregando="Buscando...">
            Abrir aluno
          </BotaoEnvio>
        </div>
      </div>

      {estado.erro ? (
        <p className="alerta-erro" role="alert">
          {estado.erro}
        </p>
      ) : null}
    </form>
  );
}
