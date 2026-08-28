import { Prisma } from "@prisma/client";

/** Campos que estouraram uma restrição @unique, ou null se o erro for outro. */
export function camposDuplicados(erro: unknown): string[] | null {
  if (
    erro instanceof Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002" &&
    erro.meta &&
    Array.isArray((erro.meta as { target?: unknown }).target)
  ) {
    return (erro.meta as { target: string[] }).target;
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    return [];
  }

  return null;
}

/** True quando o registro não pode ser removido por ainda ter vinculos. */
export function violaChaveEstrangeira(erro: unknown): boolean {
  return (
    erro instanceof Prisma.PrismaClientKnownRequestError &&
    (erro.code === "P2003" || erro.code === "P2014")
  );
}
