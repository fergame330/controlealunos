"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { atualizarAluno, excluirAluno, type EstadoAluno } from "./actions";

const ESTADO_INICIAL: EstadoAluno = {};

type Props = {
  alunoId: string;
  nome: string;
  matricula: string;
  cpf: string;
  lancamentos: number;
};

export function AcoesAluno({ alunoId, nome, matricula, cpf, lancamentos }: Props) {
  const [editando, setEditando] = useState(false);
  const [estado, acao] = useActionState(atualizarAluno, ESTADO_INICIAL);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Link href={`/alunos/${alunoId}`} className="btn-secundario px-3 py-1.5">
          Abrir
        </Link>

        <button
          type="button"
          className="btn-secundario px-3 py-1.5"
          onClick={() => setEditando((valor) => !valor)}
        >
          {editando ? "Cancelar" : "Editar"}
        </button>

        <form
          action={excluirAluno}
          onSubmit={(evento) => {
            const aviso =
              lancamentos > 0
                ? `Excluir ${nome}? Isso apaga também ${lancamentos} lançamento(s) de frequência e nota.`
                : `Excluir ${nome}?`;

            if (!window.confirm(aviso)) {
              evento.preventDefault();
            }
          }}
        >
          <input type="hidden" name="alunoId" value={alunoId} />
          <button type="submit" className="btn-perigo px-3 py-1.5">
            Excluir
          </button>
        </form>
      </div>

      {editando ? (
        <form action={acao} className="flex flex-wrap items-end justify-end gap-2">
          <input type="hidden" name="alunoId" value={alunoId} />

          <div className="w-48">
            <label className="rotulo text-left" htmlFor={`nome-${alunoId}`}>
              Nome
            </label>
            <input
              id={`nome-${alunoId}`}
              name="nome"
              className="campo"
              defaultValue={nome}
              required
            />
          </div>

          <div className="w-36">
            <label className="rotulo text-left" htmlFor={`matricula-${alunoId}`}>
              Matrícula
            </label>
            <input
              id={`matricula-${alunoId}`}
              name="matricula"
              className="campo"
              defaultValue={matricula}
              required
            />
          </div>

          <div className="w-40">
            <label className="rotulo text-left" htmlFor={`cpf-${alunoId}`}>
              CPF
            </label>
            <input
              id={`cpf-${alunoId}`}
              name="cpf"
              className="campo"
              defaultValue={cpf}
              inputMode="numeric"
              required
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
