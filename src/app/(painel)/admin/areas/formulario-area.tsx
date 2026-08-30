"use client";

import { useActionState, useEffect, useRef } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { criarArea, type EstadoArea } from "./actions";

const ESTADO_INICIAL: EstadoArea = {};

export function FormularioArea() {
  const [estado, acao] = useActionState(criarArea, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formulario.current?.reset();
    }
  }, [estado.sucesso]);

  return (
    <form ref={formulario} action={acao} className="space-y-4">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="rotulo" htmlFor="nome">
            Nome da área
          </label>
          <input
            id="nome"
            name="nome"
            className="campo"
            placeholder="Ex.: Clínica Médica"
            autoComplete="off"
            required
            minLength={2}
          />
        </div>

        <BotaoEnvio carregando="Cadastrando...">Cadastrar área</BotaoEnvio>
      </div>
    </form>
  );
}
