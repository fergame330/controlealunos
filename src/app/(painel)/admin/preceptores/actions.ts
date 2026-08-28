"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdministrador, gerarHashSenha } from "@/lib/auth";
import { SENHA_MINIMA } from "@/lib/constantes";
import { camposDuplicados, violaChaveEstrangeira } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { emailValido } from "@/lib/utils";

const ROTA = "/admin/preceptores";

export type EstadoPreceptor = { erro?: string; sucesso?: string };

function voltarCom(mensagem: string, tipo: "erro" | "sucesso"): never {
  redirect(`${ROTA}?${tipo}=${encodeURIComponent(mensagem)}`);
}

export async function criarPreceptor(
  _estadoAnterior: EstadoPreceptor,
  formData: FormData,
): Promise<EstadoPreceptor> {
  await exigirAdministrador();

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const administrador = formData.get("administrador") === "on";

  if (nome.length < 3) {
    return { erro: "Informe o nome completo do preceptor." };
  }

  if (!emailValido(email)) {
    return { erro: "Informe um e-mail válido." };
  }

  if (senha.length < SENHA_MINIMA) {
    return { erro: `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.` };
  }

  try {
    await prisma.usuario.create({
      data: { nome, email, senha: await gerarHashSenha(senha), administrador },
    });
  } catch (erro) {
    if (camposDuplicados(erro)) {
      return { erro: "Já existe um acesso cadastrado com este e-mail." };
    }

    throw erro;
  }

  revalidatePath(ROTA);

  return { sucesso: `Acesso de ${nome} criado com sucesso.` };
}

export async function redefinirSenha(
  _estadoAnterior: EstadoPreceptor,
  formData: FormData,
): Promise<EstadoPreceptor> {
  await exigirAdministrador();

  const usuarioId = String(formData.get("usuarioId") ?? "");
  const senha = String(formData.get("senha") ?? "");

  if (!usuarioId) {
    return { erro: "Usuário não informado." };
  }

  if (senha.length < SENHA_MINIMA) {
    return { erro: `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.` };
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { senha: await gerarHashSenha(senha) },
  });

  revalidatePath(ROTA);

  return { sucesso: "Senha redefinida." };
}

export async function alternarAdministrador(formData: FormData): Promise<void> {
  const admin = await exigirAdministrador();
  const usuarioId = String(formData.get("usuarioId") ?? "");

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!usuario) {
    voltarCom("Usuário não encontrado.", "erro");
  }

  if (usuario.id === admin.id) {
    voltarCom("Você não pode remover o seu próprio acesso de administrador.", "erro");
  }

  if (usuario.administrador) {
    const totalAdmins = await prisma.usuario.count({ where: { administrador: true } });

    if (totalAdmins <= 1) {
      voltarCom("O sistema precisa de pelo menos um administrador.", "erro");
    }
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { administrador: !usuario.administrador },
  });

  revalidatePath(ROTA);
  voltarCom(
    usuario.administrador
      ? `${usuario.nome} agora é apenas preceptor.`
      : `${usuario.nome} agora é administrador.`,
    "sucesso",
  );
}

export async function excluirUsuario(formData: FormData): Promise<void> {
  const admin = await exigirAdministrador();
  const usuarioId = String(formData.get("usuarioId") ?? "");

  if (usuarioId === admin.id) {
    voltarCom("Você não pode excluir o seu próprio acesso.", "erro");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

  if (!usuario) {
    voltarCom("Usuário não encontrado.", "erro");
  }

  if (usuario.administrador) {
    const totalAdmins = await prisma.usuario.count({ where: { administrador: true } });

    if (totalAdmins <= 1) {
      voltarCom("O sistema precisa de pelo menos um administrador.", "erro");
    }
  }

  try {
    await prisma.usuario.delete({ where: { id: usuario.id } });
  } catch (erro) {
    if (violaChaveEstrangeira(erro)) {
      voltarCom(
        `${usuario.nome} possui lançamentos registrados e não pode ser excluído. Remova o acesso de administrador ou mantenha o histórico.`,
        "erro",
      );
    }

    throw erro;
  }

  revalidatePath(ROTA);
  voltarCom(`Acesso de ${usuario.nome} excluído.`, "sucesso");
}
