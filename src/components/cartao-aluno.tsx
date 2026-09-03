import Link from "next/link";

import { AvatarAluno } from "@/components/avatar-aluno";
import { formatarCpf } from "@/lib/utils";

type Props = {
  aluno: {
    id: string;
    nome: string;
    matricula: string;
    cpf: string;
    fotoEnviadaEm: Date | null;
  };
  /** Aba aberta ao clicar. */
  aba?: "frequencia" | "nota";
};

/** Resultado de busca: foto grande o suficiente para reconhecer o aluno. */
export function CartaoAluno({ aluno, aba = "frequencia" }: Props) {
  return (
    <Link
      href={`/alunos/${aluno.id}?aba=${aba}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <AvatarAluno
        alunoId={aluno.id}
        nome={aluno.nome}
        fotoEnviadaEm={aluno.fotoEnviadaEm}
        tamanho="medio"
      />

      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{aluno.nome}</p>
        <p className="truncate text-xs text-slate-500">Matrícula {aluno.matricula}</p>
        <p className="truncate text-xs text-slate-500">CPF {formatarCpf(aluno.cpf)}</p>
      </div>
    </Link>
  );
}
