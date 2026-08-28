"use client";

import { useActionState, useEffect, useRef } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { NOTA_MAXIMA, NOTA_MINIMA, PESO_MAXIMO } from "@/lib/constantes";
import { registrarPontuacao, type EstadoLancamento } from "./actions";

const ESTADO_INICIAL: EstadoLancamento = {};

const SUGESTOES = [
  "Assiduidade",
  "Postura ética",
  "Raciocínio clínico",
  "Relacionamento com a equipe",
  "Comunicação com o paciente",
  "Registro em prontuário",
];

export function FormularioPontuacao({ alunoId }: { alunoId: string }) {
  const [estado, acao] = useActionState(registrarPontuacao, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formulario.current?.reset();
    }
  }, [estado.sucesso]);

  return (
    <form ref={formulario} action={acao} className="space-y-4">
      <input type="hidden" name="alunoId" value={alunoId} />

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="rotulo" htmlFor="nome">
            Competência avaliada
          </label>
          <input
            id="nome"
            name="nome"
            className="campo"
            list="competencias"
            placeholder="Ex.: Raciocínio clínico"
            autoComplete="off"
            required
          />
          <datalist id="competencias">
            {SUGESTOES.map((sugestao) => (
              <option key={sugestao} value={sugestao} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="rotulo" htmlFor="valor">
            Nota ({NOTA_MINIMA} a {NOTA_MAXIMA})
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            className="campo"
            min={NOTA_MINIMA}
            max={NOTA_MAXIMA}
            step="0.01"
            placeholder="8.5"
            required
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="peso">
            Peso
          </label>
          <input
            id="peso"
            name="peso"
            type="number"
            className="campo"
            min={1}
            max={PESO_MAXIMO}
            step={1}
            defaultValue={1}
            required
          />
          <p className="mt-1 text-xs text-slate-500">Usado na média ponderada.</p>
        </div>
      </div>

      <BotaoEnvio carregando="Registrando...">Registrar pontuação</BotaoEnvio>
    </form>
  );
}
