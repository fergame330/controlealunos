"use client";

import { useActionState, useEffect, useState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import {
  alternarAdministrador,
  excluirUsuario,
  redefinirSenha,
  type EstadoPreceptor,
} from "./actions";

const ESTADO_INICIAL: EstadoPreceptor = {};

type Props = {
  usuarioId: string;
  nome: string;
  administrador: boolean;
  ehVoce: boolean;
};

export function AcoesUsuario({ usuarioId, nome, administrador, ehVoce }: Props) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState(redefinirSenha, ESTADO_INICIAL);

  useEffect(() => {
    if (estado.sucesso) {
      const tempo = setTimeout(() => setAberto(false), 1500);
      return () => clearTimeout(tempo);
    }
  }, [estado.sucesso]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="btn-secundario px-3 py-1.5"
          onClick={() => setAberto((valor) => !valor)}
        >
          {aberto ? "Cancelar" : "Nova senha"}
        </button>

        {ehVoce ? null : (
          <>
            <form action={alternarAdministrador}>
              <input type="hidden" name="usuarioId" value={usuarioId} />
              <button type="submit" className="btn-secundario px-3 py-1.5">
                {administrador ? "Remover admin" : "Tornar admin"}
              </button>
            </form>

            <form
              action={excluirUsuario}
              onSubmit={(evento) => {
                if (!window.confirm(`Excluir o acesso de ${nome}?`)) {
                  evento.preventDefault();
                }
              }}
            >
              <input type="hidden" name="usuarioId" value={usuarioId} />
              <button type="submit" className="btn-perigo px-3 py-1.5">
                Excluir
              </button>
            </form>
          </>
        )}
      </div>

      {aberto ? (
        <form action={acao} className="flex flex-wrap items-end justify-end gap-2">
          <input type="hidden" name="usuarioId" value={usuarioId} />

          <div className="w-52">
            <label className="rotulo text-left" htmlFor={`senha-${usuarioId}`}>
              Nova senha
            </label>
            <input
              id={`senha-${usuarioId}`}
              name="senha"
              type="password"
              className="campo"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <BotaoEnvio className="btn-primario px-3 py-2" carregando="Salvando...">
            Salvar
          </BotaoEnvio>

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
