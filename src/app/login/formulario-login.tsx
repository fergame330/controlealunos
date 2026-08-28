"use client";

import { useActionState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { entrar, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = {};

export function FormularioLogin({ proximo }: { proximo?: string }) {
  const [estado, acao] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="space-y-4">
      {proximo ? <input type="hidden" name="proximo" value={proximo} /> : null}

      {estado.erro ? (
        <p className="alerta-erro" role="alert">
          {estado.erro}
        </p>
      ) : null}

      <div>
        <label className="rotulo" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="campo"
          placeholder="voce@instituicao.br"
          autoComplete="email"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="rotulo" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          className="campo"
          placeholder="********"
          autoComplete="current-password"
          required
        />
      </div>

      <BotaoEnvio className="btn-primario w-full" carregando="Entrando...">
        Entrar
      </BotaoEnvio>
    </form>
  );
}
