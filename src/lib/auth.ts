import "server-only";

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
