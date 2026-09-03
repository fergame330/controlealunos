import { NextResponse } from "next/server";

import { usuarioAtual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Serve a foto do aluno. Exige sessão: a imagem é dado pessoal e não pode ficar
 * acessível por URL solta.
 */
export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await usuarioAtual();

  if (!usuario) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { id } = await params;

  const aluno = await prisma.matricula.findUnique({
    where: { id },
    select: { foto: true, fotoTipo: true },
  });

  if (!aluno?.foto || !aluno.fotoTipo) {
    return new NextResponse("Sem foto", { status: 404 });
  }

  return new NextResponse(new Uint8Array(aluno.foto), {
    headers: {
      "Content-Type": aluno.fotoTipo,
      "Content-Length": String(aluno.foto.byteLength),
      // Privada e curta: a URL leva ?v=<data de envio>, então trocar a foto
      // invalida o cache sem depender do tempo.
      "Cache-Control": "private, max-age=300",
    },
  });
}
