"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  carregando?: string;
  className?: string;
};

export function BotaoEnvio({ children, carregando = "Salvando...", className = "btn-primario" }: Props) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? carregando : children}
    </button>
  );
}
