"use server";

import { redirect } from "next/navigation";

import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { somenteDigitos } from "@/lib/utils";

export type EstadoBusca = { erro?: string };

/** Localiza o aluno pelo número de matrícula ou pelo CPF e abre a tela dele. */
export async function buscarAluno(
  _estadoAnterior: EstadoBusca,
  formData: FormData,
): Promise<EstadoBusca> {
  await exigirUsuario();

  const termo = String(formData.get("termo") ?? "").trim();

  if (!termo) {
    return { erro: "Informe o número de matrícula ou o CPF do aluno." };
  }

  const digitos = somenteDigitos(termo);

  const aluno = await prisma.matricula.findFirst({
    where: {
      OR: [
        { matricula: termo },
        ...(digitos ? [{ matricula: digitos }, { cpf: digitos }] : []),
      ],
    },
    select: { id: true },
  });

  if (!aluno) {
    return { erro: `Nenhum aluno encontrado para "${termo}".` };
  }

  redirect(`/alunos/${aluno.id}`);
}
