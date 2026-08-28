"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { BotaoEnvio } from "@/components/botao-envio";
import { formatarMinutos, horarioValido, minutosEntre } from "@/lib/utils";
import { registrarFrequencia, type EstadoLancamento } from "./actions";

const ESTADO_INICIAL: EstadoLancamento = {};

export function FormularioFrequencia({ alunoId, hoje }: { alunoId: string; hoje: string }) {
  const [estado, acao] = useActionState(registrarFrequencia, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [carga, setCarga] = useState("");
  const [cargaManual, setCargaManual] = useState(false);

  const intervalo =
    horarioValido(inicio) && horarioValido(fim) ? minutosEntre(inicio, fim) : null;
  const intervaloValido = intervalo !== null && intervalo > 0;
  const intervaloInvertido = intervalo !== null && intervalo <= 0;

  // Enquanto o preceptor não editar o campo, a carga horária acompanha o intervalo.
  useEffect(() => {
    if (!cargaManual) {
      setCarga(intervaloValido ? String(intervalo) : "");
    }
  }, [intervalo, intervaloValido, cargaManual]);

  useEffect(() => {
    if (estado.sucesso) {
      formulario.current?.reset();
      setInicio("");
      setFim("");
      setCarga("");
      setCargaManual(false);
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
        <div>
          <label className="rotulo" htmlFor="dataReferente">
            Data referente
          </label>
          <input
            id="dataReferente"
            name="dataReferente"
            type="date"
            className="campo"
            defaultValue={hoje}
            max={hoje}
            required
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="horarioInicio">
            Horário de início
          </label>
          <input
            id="horarioInicio"
            name="horarioInicio"
            type="time"
            className="campo"
            value={inicio}
            onChange={(evento) => setInicio(evento.target.value)}
            required
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="horarioFim">
            Horário de fim
          </label>
          <input
            id="horarioFim"
            name="horarioFim"
            type="time"
            className="campo"
            value={fim}
            onChange={(evento) => setFim(evento.target.value)}
            aria-invalid={intervaloInvertido || undefined}
            aria-describedby={intervaloInvertido ? "erro-horario" : undefined}
            required
          />
          {intervaloInvertido ? (
            <p id="erro-horario" className="mt-1 text-xs font-medium text-red-600">
              O horário de fim deve ser posterior ao horário de início.
            </p>
          ) : null}
        </div>

        <div>
          <label className="rotulo" htmlFor="cargaHoraria">
            Carga horária (minutos)
          </label>
          <input
            id="cargaHoraria"
            name="cargaHoraria"
            type="number"
            className="campo"
            min={1}
            step={1}
            value={carga}
            onChange={(evento) => {
              setCargaManual(true);
              setCarga(evento.target.value);
            }}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            {intervaloValido
              ? `Intervalo informado: ${formatarMinutos(intervalo)}.`
              : "Preenchida automaticamente pelo intervalo."}
            {cargaManual && carga !== "" && Number(carga) > 0
              ? ` Equivale a ${formatarMinutos(Number(carga))}.`
              : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <BotaoEnvio carregando="Registrando...">Registrar frequência</BotaoEnvio>

        {cargaManual ? (
          <button
            type="button"
            className="text-sm text-slate-500 underline-offset-2 hover:underline"
            onClick={() => setCargaManual(false)}
          >
            Voltar ao cálculo automático
          </button>
        ) : null}
      </div>
    </form>
  );
}
