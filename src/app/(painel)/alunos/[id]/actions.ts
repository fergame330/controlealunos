"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdministrador, exigirUsuario } from "@/lib/auth";
import { NOTA_MAXIMA, NOTA_MINIMA } from "@/lib/constantes";
import { prisma } from "@/lib/prisma";
import { dadosDaRequisicao } from "@/lib/request-info";
import { dataDoFormulario, horarioValido, minutosEntre } from "@/lib/utils";

export type EstadoLancamento = { erro?: string; sucesso?: string };

function voltarCom(alunoId: string, aba: string, mensagem: string, tipo: "erro" | "sucesso"): never {
  redirect(`/alunos/${alunoId}?aba=${aba}&${tipo}=${encodeURIComponent(mensagem)}`);
}

/** Aceita "8,5" e "8.5". Retorna null quando não é um número válido. */
function lerDecimal(valor: string): number | null {
  const normalizado = valor.trim().replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

export async function registrarFrequencia(
  _estadoAnterior: EstadoLancamento,
  formData: FormData,
): Promise<EstadoLancamento> {
  const usuario = await exigirUsuario();

  const alunoId = String(formData.get("alunoId") ?? "");
  const dataReferente = dataDoFormulario(String(formData.get("dataReferente") ?? ""));
  const horarioInicio = String(formData.get("horarioInicio") ?? "");
  const horarioFim = String(formData.get("horarioFim") ?? "");
  const cargaInformada = String(formData.get("cargaHoraria") ?? "").trim();

  if (!alunoId) return { erro: "Aluno não informado." };

  if (!dataReferente) {
    return { erro: "Informe a data referente da frequência." };
  }

  if (dataReferente.getTime() > Date.now()) {
    return { erro: "A data referente não pode estar no futuro." };
  }

  if (!horarioValido(horarioInicio) || !horarioValido(horarioFim)) {
    return { erro: "Informe os horários de início e fim no formato HH:MM." };
  }

  const duracao = minutosEntre(horarioInicio, horarioFim);

  if (duracao <= 0) {
    return { erro: "O horário de fim deve ser posterior ao horário de início." };
  }

  const cargaHoraria = cargaInformada === "" ? duracao : Number(cargaInformada);

  if (!Number.isInteger(cargaHoraria) || cargaHoraria <= 0) {
    return { erro: "A carga horária deve ser um número inteiro de minutos maior que zero." };
  }

  if (cargaHoraria > duracao) {
    return {
      erro: `A carga horária (${cargaHoraria} min) não pode ser maior que o intervalo informado (${duracao} min).`,
    };
  }

  const aluno = await prisma.matricula.findUnique({ where: { id: alunoId }, select: { id: true } });

  if (!aluno) return { erro: "Aluno não encontrado." };

  const auditoria = await dadosDaRequisicao();

  await prisma.frequencia.create({
    data: {
      alunoId: aluno.id,
      preceptorId: usuario.id,
      dataReferente,
      horarioInicio,
      horarioFim,
      cargaHoraria,
      ...auditoria,
    },
  });

  revalidatePath(`/alunos/${aluno.id}`);
  revalidatePath("/painel");

  return { sucesso: "Frequência registrada." };
}

/**
 * Grava a avaliação de um aluno em uma área. Cada preceptor tem uma avaliação
 * por área — reenviar o formulário substitui as notas anteriores dele, sem
 * afetar as de outros preceptores.
 */
export async function salvarAvaliacao(
  _estadoAnterior: EstadoLancamento,
  formData: FormData,
): Promise<EstadoLancamento> {
  const usuario = await exigirUsuario();

  const alunoId = String(formData.get("alunoId") ?? "");
  const areaId = String(formData.get("areaId") ?? "");

  if (!alunoId) return { erro: "Aluno não informado." };
  if (!areaId) return { erro: "Escolha a área da avaliação." };

  const [aluno, area, competencias] = await Promise.all([
    prisma.matricula.findUnique({ where: { id: alunoId }, select: { id: true } }),
    prisma.area.findUnique({ where: { id: areaId }, select: { id: true, nome: true } }),
    prisma.competencia.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  if (!aluno) return { erro: "Aluno não encontrado." };
  if (!area) return { erro: "Área não encontrada." };

  if (competencias.length === 0) {
    return { erro: "Nenhuma competência cadastrada. Rode o seed do banco." };
  }

  // Todas as competências são obrigatórias: a nota da avaliação é a média
  // delas, e uma lista pela metade produziria uma média enganosa.
  const notas: Array<{ competenciaId: string; valor: number }> = [];

  for (const competencia of competencias) {
    const bruto = String(formData.get(`competencia-${competencia.id}`) ?? "").trim();

    if (bruto === "") {
      return { erro: `Informe a nota de "${competencia.nome}".` };
    }

    const valor = lerDecimal(bruto);

    if (valor === null || valor < NOTA_MINIMA || valor > NOTA_MAXIMA) {
      return {
        erro: `A nota de "${competencia.nome}" deve ser um número entre ${NOTA_MINIMA} e ${NOTA_MAXIMA}.`,
      };
    }

    notas.push({ competenciaId: competencia.id, valor });
  }

  const auditoria = await dadosDaRequisicao();

  await prisma.$transaction(async (tx) => {
    const avaliacao = await tx.avaliacao.upsert({
      where: {
        alunoId_areaId_preceptorId: {
          alunoId: aluno.id,
          areaId: area.id,
          preceptorId: usuario.id,
        },
      },
      update: { dataEnvio: new Date(), ...auditoria },
      create: {
        alunoId: aluno.id,
        areaId: area.id,
        preceptorId: usuario.id,
        ...auditoria,
      },
      select: { id: true },
    });

    await tx.pontuacao.deleteMany({ where: { avaliacaoId: avaliacao.id } });
    await tx.pontuacao.createMany({
      data: notas.map((nota) => ({
        avaliacaoId: avaliacao.id,
        competenciaId: nota.competenciaId,
        valor: nota.valor.toFixed(2),
      })),
    });
  });

  revalidatePath(`/alunos/${aluno.id}`);
  revalidatePath("/painel");

  return { sucesso: `Avaliação de ${area.nome} registrada.` };
}

export async function excluirFrequencia(formData: FormData): Promise<void> {
  await exigirAdministrador();

  const id = String(formData.get("frequenciaId") ?? "");
  const frequencia = await prisma.frequencia.findUnique({
    where: { id },
    select: { id: true, alunoId: true },
  });

  if (!frequencia) {
    redirect("/painel");
  }

  await prisma.frequencia.delete({ where: { id: frequencia.id } });

  revalidatePath(`/alunos/${frequencia.alunoId}`);
  voltarCom(frequencia.alunoId, "frequencia", "Frequência excluída.", "sucesso");
}

export async function excluirAvaliacao(formData: FormData): Promise<void> {
  await exigirAdministrador();

  const id = String(formData.get("avaliacaoId") ?? "");
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id },
    select: { id: true, alunoId: true, area: { select: { nome: true } } },
  });

  if (!avaliacao) {
    redirect("/painel");
  }

  // As pontuações saem junto, por cascade.
  await prisma.avaliacao.delete({ where: { id: avaliacao.id } });

  revalidatePath(`/alunos/${avaliacao.alunoId}`);
  voltarCom(
    avaliacao.alunoId,
    "nota",
    `Avaliação de ${avaliacao.area.nome} excluída.`,
    "sucesso",
  );
}
