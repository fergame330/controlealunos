import "server-only";

import { timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import {
  COOKIE_SESSAO,
  DURACAO_SESSAO_SEGUNDOS,
  assinarSessao,
  lerSessao,
} from "@/lib/session";

export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  administrador: boolean;
};

const RODADAS_HASH = 12;

export function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, RODADAS_HASH);
}

/** Formato de um hash bcrypt: $2a/$2b/$2y, custo e 53 caracteres de sal+digest. */
const FORMATO_BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function ehHashBcrypt(valor: string): boolean {
  return FORMATO_BCRYPT.test(valor);
}

/** Compara sem vazar, pelo tempo, em que caractere as strings divergem. */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  if (bufferA.length !== bufferB.length) {
    // timingSafeEqual exige o mesmo tamanho; compara contra si mesmo para
    // manter o custo parecido antes de recusar.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Confere a senha aceitando dois formatos de armazenamento:
 *
 * - hash bcrypt, que é como o sistema grava;
 * - texto puro, de acessos criados fora do app (INSERT manual, importação).
 *
 * O segundo caso existe só para não trancar ninguém para fora: quando confere,
 * `precisaMigrar` avisa quem chamou para regravar a senha como hash.
 */
export async function conferirSenhaArmazenada(
  senha: string,
  armazenada: string,
): Promise<{ confere: boolean; precisaMigrar: boolean }> {
  if (ehHashBcrypt(armazenada)) {
    return { confere: await bcrypt.compare(senha, armazenada), precisaMigrar: false };
  }

  const confere = iguaisEmTempoConstante(senha, armazenada);

  return { confere, precisaMigrar: confere };
}

export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarSessao(usuario: UsuarioAutenticado): Promise<void> {
  const token = await assinarSessao({
    usuarioId: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    administrador: usuario.administrador,
  });

  const jar = await cookies();

  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SESSAO_SEGUNDOS,
  });
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_SESSAO);
}

/**
 * Le a sessao do cookie e confirma no banco que o usuário ainda existe.
 * O papel (administrador) sempre vem do banco, nunca do token, para que a
 * remocao de um acesso tenha efeito imediato.
 */
export const usuarioAtual = cache(async (): Promise<UsuarioAutenticado | null> => {
  const jar = await cookies();
  const sessao = await lerSessao(jar.get(COOKIE_SESSAO)?.value);

  if (!sessao) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.usuarioId },
    select: { id: true, nome: true, email: true, administrador: true },
  });

  return usuario;
});

export async function exigirUsuario(): Promise<UsuarioAutenticado> {
  const usuario = await usuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  return usuario;
}

export async function exigirAdministrador(): Promise<UsuarioAutenticado> {
  const usuario = await exigirUsuario();

  if (!usuario.administrador) {
    redirect("/painel");
  }

  return usuario;
}
