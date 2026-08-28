import { jwtVerify, SignJWT } from "jose";

export const COOKIE_SESSAO = "controle_alunos_sessao";
export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 8; // 8 horas

export type Sessao = {
  usuarioId: string;
  email: string;
  nome: string;
  administrador: boolean;
};

function chaveSecreta(): Uint8Array {
  const segredo = process.env.AUTH_SECRET;

  if (!segredo || segredo.length < 16) {
    throw new Error(
      "AUTH_SECRET não configurado. Defina AUTH_SECRET no .env com pelo menos 16 caracteres.",
    );
  }

  return new TextEncoder().encode(segredo);
}

export async function assinarSessao(sessao: Sessao): Promise<string> {
  return new SignJWT({ ...sessao })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sessao.usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_SEGUNDOS}s`)
    .sign(chaveSecreta());
}

export async function lerSessao(token: string | undefined): Promise<Sessao | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, chaveSecreta(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.usuarioId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.nome !== "string" ||
      typeof payload.administrador !== "boolean"
    ) {
      return null;
    }

    return {
      usuarioId: payload.usuarioId,
      email: payload.email,
      nome: payload.nome,
      administrador: payload.administrador,
    };
  } catch {
    return null;
  }
}
