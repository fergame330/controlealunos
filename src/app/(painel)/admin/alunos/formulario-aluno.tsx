"use client";

import { useActionState, useEffect, useRef } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { criarAluno, type EstadoAluno } from "./actions";

const ESTADO_INICIAL: EstadoAluno = {};

export function FormularioAluno() {
  const [estado, acao] = useActionState(criarAluno, ESTADO_INICIAL);
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="rotulo" htmlFor="nome">
            Nome completo
          </label>
          <input id="nome" name="nome" className="campo" required minLength={3} />
        </div>

        <div>
          <label className="rotulo" htmlFor="matricula">
            Número de matrícula
          </label>
          <input
            id="matricula"
            name="matricula"
            className="campo"
            placeholder="Ex.: 2024001234"
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="cpf">
            CPF
          </label>
          <input
            id="cpf"
            name="cpf"
            className="campo"
            placeholder="000.000.000-00"
            inputMode="numeric"
            autoComplete="off"
            required
          />
        </div>
      </div>

      <BotaoEnvio carregando="Cadastrando...">Cadastrar aluno</BotaoEnvio>
    </form>
  );
}
