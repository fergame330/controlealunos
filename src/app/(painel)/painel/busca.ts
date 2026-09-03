import "server-only";

import { prisma } from "@/lib/prisma";
import { somenteDigitos } from "@/lib/utils";

export type AlunoEncontrado = {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  fotoEnviadaEm: Date | null;
};

const CAMPOS = {
  id: true,
  nome: true,
  matricula: true,
  cpf: true,
  fotoEnviadaEm: true,
} as const;

const LIMITE = 24;

export type ResultadoBusca = {
  alunos: AlunoEncontrado[];
  /** Único aluno cuja matrícula ou CPF bate exatamente com o termo. */
  correspondenciaExata: AlunoEncontrado | null;
};

/**
 * Procura por nome, número de matrícula ou CPF. O nome usa busca parcial e sem
 * diferenciar maiúsculas; matrícula e CPF também aceitam correspondência
 * exata, que permite pular direto para o aluno.
 */
export async function procurarAlunos(termo: string): Promise<ResultadoBusca> {
  const limpo = termo.trim();

  if (!limpo) return { alunos: [], correspondenciaExata: null };

  const digitos = somenteDigitos(limpo);

  const alunos = await prisma.matricula.findMany({
    where: {
      OR: [
        { nome: { contains: limpo, mode: "insensitive" } },
        { matricula: { contains: limpo, mode: "insensitive" } },
        ...(digitos ? [{ cpf: { contains: digitos } }] : []),
      ],
    },
    orderBy: { nome: "asc" },
    take: LIMITE,
    select: CAMPOS,
  });

  const exatos = alunos.filter(
    (aluno) =>
      aluno.matricula.toLowerCase() === limpo.toLowerCase() ||
      (digitos.length === 11 && aluno.cpf === digitos),
  );

  return {
    alunos,
    correspondenciaExata: exatos.length === 1 ? exatos[0] : null,
  };
}
