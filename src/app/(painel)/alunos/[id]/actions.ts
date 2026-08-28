"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdministrador, exigirUsuario } from "@/lib/auth";
import { NOTA_MAXIMA, NOTA_MINIMA, PESO_MAXIMO } from "@/lib/constantes";
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

export async function registrarPontuacao(
  _estadoAnterior: EstadoLancamento,
  formData: FormData,
): Promise<EstadoLancamento> {
  const usuario = await exigirUsuario();

  const alunoId = String(formData.get("alunoId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim().replace(/\s+/g, " ");
  const valor = lerDecimal(String(formData.get("valor") ?? ""));
  const peso = Number(String(formData.get("peso") ?? "1").trim());

  if (!alunoId) return { erro: "Aluno não informado." };

  if (nome.length < 2) {
    return { erro: "Informe o nome da competência avaliada." };
  }

  if (valor === null || valor < NOTA_MINIMA || valor > NOTA_MAXIMA) {
    return { erro: `A nota deve ser um número entre ${NOTA_MINIMA} e ${NOTA_MAXIMA}.` };
  }

  if (!Number.isInteger(peso) || peso < 1 || peso > PESO_MAXIMO) {
    return { erro: `O peso deve ser um número inteiro entre 1 e ${PESO_MAXIMO}.` };
  }

  const aluno = await prisma.matricula.findUnique({ where: { id: alunoId }, select: { id: true } });

  if (!aluno) return { erro: "Aluno não encontrado." };

  const auditoria = await dadosDaRequisicao();

  // A ficha de notas do aluno é criada na primeira pontuação lançada.
  const nota = await prisma.nota.upsert({
    where: { alunoId: aluno.id },
    update: {},
    create: { alunoId: aluno.id },
    select: { id: true },
  });

  await prisma.pontuacao.create({
    data: {
      notaId: nota.id,
      preceptorId: usuario.id,
      nome,
      valor: valor.toFixed(2),
      peso,
      ...auditoria,
    },
  });

  // Marca a ficha como atualizada para refletir o ultimo lançamento.
  await prisma.nota.update({ where: { id: nota.id }, data: { atualizadoEm: new Date() } });

  revalidatePath(`/alunos/${aluno.id}`);
  revalidatePath("/painel");

  return { sucesso: `Pontuação de "${nome}" registrada.` };
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

export async function excluirPontuacao(formData: FormData): Promise<void> {
  await exigirAdministrador();

  const id = String(formData.get("pontuacaoId") ?? "");
  const pontuacao = await prisma.pontuacao.findUnique({
    where: { id },
    select: { id: true, nota: { select: { alunoId: true } } },
  });

  if (!pontuacao) {
    redirect("/painel");
  }

  await prisma.pontuacao.delete({ where: { id: pontuacao.id } });

  revalidatePath(`/alunos/${pontuacao.nota.alunoId}`);
  voltarCom(pontuacao.nota.alunoId, "nota", "Pontuação excluída.", "sucesso");
}
