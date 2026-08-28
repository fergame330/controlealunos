"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdministrador } from "@/lib/auth";
import { camposDuplicados } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { cpfValido, somenteDigitos } from "@/lib/utils";

const ROTA = "/admin/alunos";

export type EstadoAluno = { erro?: string; sucesso?: string };

type DadosAluno = { nome: string; matricula: string; cpf: string };

function voltarCom(mensagem: string, tipo: "erro" | "sucesso"): never {
  redirect(`${ROTA}?${tipo}=${encodeURIComponent(mensagem)}`);
}

function lerDados(formData: FormData): DadosAluno | { erro: string } {
  const nome = String(formData.get("nome") ?? "").trim().replace(/\s+/g, " ");
  const matricula = String(formData.get("matricula") ?? "").trim();
  const cpf = somenteDigitos(String(formData.get("cpf") ?? ""));

  if (nome.length < 3) {
    return { erro: "Informe o nome completo do aluno." };
  }

  if (matricula.length < 3) {
    return { erro: "Informe o número de matrícula." };
  }

  if (!cpfValido(cpf)) {
    return { erro: "CPF inválido. Confira os dígitos informados." };
  }

  return { nome, matricula, cpf };
}

function mensagemDuplicidade(campos: string[]): string {
  if (campos.some((campo) => campo.toLowerCase().includes("cpf"))) {
    return "Já existe um aluno cadastrado com este CPF.";
  }

  if (campos.some((campo) => campo.toLowerCase().includes("matricula"))) {
    return "Já existe um aluno cadastrado com este número de matrícula.";
  }

  return "Já existe um aluno com esta matrícula ou CPF.";
}

export async function criarAluno(
  _estadoAnterior: EstadoAluno,
  formData: FormData,
): Promise<EstadoAluno> {
  await exigirAdministrador();

  const dados = lerDados(formData);

  if ("erro" in dados) return { erro: dados.erro };

  try {
    await prisma.matricula.create({ data: dados });
  } catch (erro) {
    const campos = camposDuplicados(erro);

    if (campos) return { erro: mensagemDuplicidade(campos) };

    throw erro;
  }

  revalidatePath(ROTA);

  return { sucesso: `Aluno ${dados.nome} cadastrado com sucesso.` };
}

export async function atualizarAluno(
  _estadoAnterior: EstadoAluno,
  formData: FormData,
): Promise<EstadoAluno> {
  await exigirAdministrador();

  const alunoId = String(formData.get("alunoId") ?? "");
  const dados = lerDados(formData);

  if (!alunoId) return { erro: "Aluno não informado." };
  if ("erro" in dados) return { erro: dados.erro };

  try {
    await prisma.matricula.update({ where: { id: alunoId }, data: dados });
  } catch (erro) {
    const campos = camposDuplicados(erro);

    if (campos) return { erro: mensagemDuplicidade(campos) };

    throw erro;
  }

  revalidatePath(ROTA);
  revalidatePath(`/alunos/${alunoId}`);

  return { sucesso: "Dados atualizados." };
}

export async function excluirAluno(formData: FormData): Promise<void> {
  await exigirAdministrador();

  const alunoId = String(formData.get("alunoId") ?? "");
  const aluno = await prisma.matricula.findUnique({ where: { id: alunoId } });

  if (!aluno) {
    voltarCom("Aluno não encontrado.", "erro");
  }

  await prisma.matricula.delete({ where: { id: aluno.id } });

  revalidatePath(ROTA);
  voltarCom(`Aluno ${aluno.nome} excluído junto com seus lançamentos.`, "sucesso");
}
