import { iniciais } from "@/lib/imagem";

const TAMANHOS = {
  pequeno: "h-10 w-10 text-xs",
  medio: "h-14 w-14 text-sm",
  grande: "h-20 w-20 text-lg",
} as const;

type Props = {
  alunoId: string;
  nome: string;
  /** Data do último envio; entra na URL para invalidar o cache ao trocar a foto. */
  fotoEnviadaEm: Date | null;
  tamanho?: keyof typeof TAMANHOS;
};

/** Foto do aluno, ou as iniciais dele quando não há foto. */
export function AvatarAluno({ alunoId, nome, fotoEnviadaEm, tamanho = "medio" }: Props) {
  const classes = `${TAMANHOS[tamanho]} shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100`;

  if (!fotoEnviadaEm) {
    return (
      <div
        className={`${classes} flex items-center justify-center font-semibold text-slate-500`}
        aria-hidden="true"
      >
        {iniciais(nome)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a rota já devolve
    // a imagem no tamanho final; o otimizador do Next não agrega aqui.
    <img
      src={`/api/alunos/${alunoId}/foto?v=${fotoEnviadaEm.getTime()}`}
      alt={`Foto de ${nome}`}
      className={`${classes} object-cover`}
      loading="lazy"
    />
  );
}
