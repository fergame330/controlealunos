"use client";

import { useActionState, useEffect, useRef } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { criarPreceptor, type EstadoPreceptor } from "./actions";

const ESTADO_INICIAL: EstadoPreceptor = {};

export function FormularioPreceptor() {
  const [estado, acao] = useActionState(criarPreceptor, ESTADO_INICIAL);
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
          <label className="rotulo" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="campo"
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="senha">
            Senha provisória
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            className="campo"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-slate-500">Mínimo de 8 caracteres.</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="administrador"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Conceder permissão de administrador
      </label>

      <BotaoEnvio carregando="Cadastrando...">Cadastrar acesso</BotaoEnvio>
    </form>
  );
}
