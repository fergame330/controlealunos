"use server";

import { redirect } from "next/navigation";

import { conferirSenhaArmazenada, criarSessao, gerarHashSenha } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type EstadoLogin = { erro?: string };

// Hash descartavel usado quando o e-mail não existe, para que a resposta leve
// o mesmo tempo de um login válido e não revele quais e-mails estão cadastrados.
const HASH_FALSO = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.9pC0nS2LOSXwn0J7cUeK/pS1WgnJ2Vy";

function destinoSeguro(proximo: FormDataEntryValue | null): string {
  if (typeof proximo === "string" && proximo.startsWith("/") && !proximo.startsWith("//")) {
    return proximo;
  }

  return "/painel";
}

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const { confere, precisaMigrar } = await conferirSenhaArmazenada(
    senha,
    usuario?.senha ?? HASH_FALSO,
  );

  if (!usuario || !confere) {
    return { erro: "E-mail ou senha inválidos." };
  }

  // Acesso criado fora do app, com a senha em texto puro: agora que ela foi
  // conferida, regrava como hash para que o texto puro não continue no banco.
  if (precisaMigrar) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: await gerarHashSenha(senha) },
    });
  }

  await criarSessao({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    administrador: usuario.administrador,
  });

  redirect(destinoSeguro(formData.get("proximo")));
}
