"use client";

type Props = {
  acao: (formData: FormData) => Promise<void>;
  nomeCampo: string;
  valor: string;
  confirmacao: string;
  rotulo?: string;
};

export function BotaoExcluir({ acao, nomeCampo, valor, confirmacao, rotulo = "Excluir" }: Props) {
  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        if (!window.confirm(confirmacao)) {
          evento.preventDefault();
        }
      }}
    >
      <input type="hidden" name={nomeCampo} value={valor} />
      <button type="submit" className="btn-perigo px-3 py-1.5">
        {rotulo}
      </button>
    </form>
  );
}
