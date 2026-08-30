"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdministrador } from "@/lib/auth";
import { camposDuplicados, violaChaveEstrangeira } from "@/lib/erros";
import { prisma } from "@/lib/prisma";

const ROTA = "/admin/areas";

export type EstadoArea = { erro?: string; sucesso?: string };

function voltarCom(mensagem: string, tipo: "erro" | "sucesso"): never {
  redirect(`${ROTA}?${tipo}=${encodeURIComponent(mensagem)}`);
}

function lerNome(formData: FormData): string {
  return String(formData.get("nome") ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function criarArea(
  _estadoAnterior: EstadoArea,
  formData: FormData,
): Promise<EstadoArea> {
  await exigirAdministrador();

  const nome = lerNome(formData);

  if (nome.length < 2) {
    return { erro: "Informe o nome da área." };
  }

  try {
    await prisma.area.create({ data: { nome } });
  } catch (erro) {
    if (camposDuplicados(erro)) {
      return { erro: "Já existe uma área com esse nome." };
    }

    throw erro;
  }

  revalidatePath(ROTA);

  return { sucesso: `Área "${nome}" cadastrada.` };
}

export async function renomearArea(
  _estadoAnterior: EstadoArea,
  formData: FormData,
): Promise<EstadoArea> {
  await exigirAdministrador();

  const areaId = String(formData.get("areaId") ?? "");
  const nome = lerNome(formData);

  if (!areaId) return { erro: "Área não informada." };

  if (nome.length < 2) {
    return { erro: "Informe o nome da área." };
  }

  try {
    await prisma.area.update({ where: { id: areaId }, data: { nome } });
  } catch (erro) {
    if (camposDuplicados(erro)) {
      return { erro: "Já existe uma área com esse nome." };
    }

    throw erro;
  }

  revalidatePath(ROTA);

  return { sucesso: "Área renomeada." };
}

export async function excluirArea(formData: FormData): Promise<void> {
  await exigirAdministrador();

  const areaId = String(formData.get("areaId") ?? "");
  const area = await prisma.area.findUnique({ where: { id: areaId } });

  if (!area) {
    voltarCom("Área não encontrada.", "erro");
  }

  try {
    await prisma.area.delete({ where: { id: area.id } });
  } catch (erro) {
    if (violaChaveEstrangeira(erro)) {
      voltarCom(
        `A área "${area.nome}" já tem avaliações lançadas e não pode ser excluída.`,
        "erro",
      );
    }

    throw erro;
  }

  revalidatePath(ROTA);
  voltarCom(`Área "${area.nome}" excluída.`, "sucesso");
}
